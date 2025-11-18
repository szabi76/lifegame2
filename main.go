package main

import (
	"fmt"
	"math"
	"math/rand"
	"time"

	rl "github.com/gen2brain/raylib-go/raylib"
)

const (
	screenWidth   = 1920
	screenHeight  = 1080
	cellSize      = 8
	cols          = screenWidth / cellSize
	rows          = screenHeight / cellSize
	targetFPS     = 60
	defaultSpeed  = 10 // Generations per second
)

// CellType represents different cell types
type CellType int

const (
	TypeNormal CellType = iota
	TypePlague
	TypeSuperbreed
	TypeCleaner
	TypeMutated
)

// Cell represents a single cell in the grid
type Cell struct {
	alive      bool
	age        int
	cellType   CellType
	resources  float32
	chaosLevel float32
}

// Game holds the game state
type Game struct {
	grid           [][]Cell
	nextGrid       [][]Cell
	generation     int
	speed          int
	paused         bool
	showGrid       bool
	showAging      bool
	wrapEdges      bool
	mutationRate   float32
	plagueRate     float32
	cleanerRate    float32
	lastUpdateTime time.Time
	theme          string
}

// NewGame creates a new game instance
func NewGame() *Game {
	game := &Game{
		grid:         makeGrid(),
		nextGrid:     makeGrid(),
		generation:   0,
		speed:        defaultSpeed,
		paused:       true,
		showGrid:     true,
		showAging:    true,
		wrapEdges:    true,
		mutationRate: 0.05,
		plagueRate:   0.25,
		cleanerRate:  0.30,
		theme:        "neon",
	}
	game.lastUpdateTime = time.Now()
	return game
}

// makeGrid creates an empty grid
func makeGrid() [][]Cell {
	grid := make([][]Cell, rows)
	for i := range grid {
		grid[i] = make([]Cell, cols)
		for j := range grid[i] {
			grid[i][j] = Cell{
				alive:     false,
				age:       0,
				cellType:  TypeNormal,
				resources: 1.0,
			}
		}
	}
	return grid
}

// Randomize fills the grid with random cells
func (g *Game) Randomize() {
	for i := range g.grid {
		for j := range g.grid[i] {
			if rand.Float32() < 0.3 {
				g.grid[i][j].alive = true
				g.grid[i][j].age = 1
				g.grid[i][j].cellType = TypeNormal
			} else {
				g.grid[i][j].alive = false
				g.grid[i][j].age = 0
			}
			g.grid[i][j].resources = 1.0
		}
	}
	g.generation = 0
}

// Clear resets the grid
func (g *Game) Clear() {
	for i := range g.grid {
		for j := range g.grid[i] {
			g.grid[i][j].alive = false
			g.grid[i][j].age = 0
			g.grid[i][j].cellType = TypeNormal
			g.grid[i][j].resources = 1.0
			g.grid[i][j].chaosLevel = 0
		}
	}
	g.generation = 0
}

// CountNeighbors counts living neighbors around a cell
func (g *Game) CountNeighbors(row, col int) int {
	count := 0
	for i := -1; i <= 1; i++ {
		for j := -1; j <= 1; j++ {
			if i == 0 && j == 0 {
				continue
			}

			newRow := row + i
			newCol := col + j

			if g.wrapEdges {
				newRow = (newRow + rows) % rows
				newCol = (newCol + cols) % cols
			} else {
				if newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols {
					continue
				}
			}

			if g.grid[newRow][newCol].alive {
				count++
			}
		}
	}
	return count
}

// CountSpecialNeighbors counts neighbors of a specific type
func (g *Game) CountSpecialNeighbors(row, col int, cellType CellType) int {
	count := 0
	for i := -1; i <= 1; i++ {
		for j := -1; j <= 1; j++ {
			if i == 0 && j == 0 {
				continue
			}

			newRow := row + i
			newCol := col + j

			if g.wrapEdges {
				newRow = (newRow + rows) % rows
				newCol = (newCol + cols) % cols
			} else {
				if newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols {
					continue
				}
			}

			if g.grid[newRow][newCol].alive && g.grid[newRow][newCol].cellType == cellType {
				count++
			}
		}
	}
	return count
}

// NextGeneration computes the next generation
func (g *Game) NextGeneration() {
	// Regenerate resources and decay chaos
	for i := range g.grid {
		for j := range g.grid[i] {
			if g.grid[i][j].resources < 1.0 {
				g.grid[i][j].resources = float32(math.Min(1.0, float64(g.grid[i][j].resources+0.005)))
			}
			if g.grid[i][j].chaosLevel > 0 {
				g.grid[i][j].chaosLevel -= 0.5
				if g.grid[i][j].chaosLevel < 0 {
					g.grid[i][j].chaosLevel = 0
				}
			}
		}
	}

	// Compute next generation
	for i := range g.grid {
		for j := range g.grid[i] {
			neighbors := g.CountNeighbors(i, j)
			cell := &g.grid[i][j]
			nextCell := &g.nextGrid[i][j]

			if cell.alive {
				// Cell is alive
				consumption := float32(0.01)
				if cell.cellType == TypePlague {
					consumption = 0.02
				}
				cell.resources = float32(math.Max(0, float64(cell.resources-consumption)))

				surviveNeighbors := []int{2, 3}
				if cell.cellType == TypeSuperbreed || cell.cellType == TypeMutated {
					surviveNeighbors = []int{1, 2, 3, 4}
				}

				resourcePenalty := cell.resources < 0.3 && rand.Float32() < 0.3
				survive := false
				for _, n := range surviveNeighbors {
					if neighbors == n {
						survive = true
						break
					}
				}

				if survive && !resourcePenalty {
					nextCell.alive = true
					nextCell.age = cell.age + 1
					nextCell.cellType = cell.cellType
					nextCell.resources = cell.resources
					nextCell.chaosLevel = cell.chaosLevel

					// Cleaner cells clean neighbors
					cleanerNeighbors := g.CountSpecialNeighbors(i, j, TypeCleaner)
					if cell.cellType == TypeCleaner || cleanerNeighbors > 0 {
						nextCell.cellType = TypeCleaner
					}

					// Mutation
					if cell.cellType != TypeMutated && rand.Float32() < g.mutationRate {
						nextCell.cellType = TypeMutated
					}

					// Plague mortality
					if cell.cellType == TypePlague && cell.age > 5 && rand.Float32() < 0.4 {
						nextCell.alive = false
						nextCell.age = 0
					}
				} else {
					nextCell.alive = false
					nextCell.age = 0
					nextCell.cellType = TypeNormal
				}
			} else {
				// Cell is dead
				birthNeighbors := []int{3}
				superbreedNeighbors := g.CountSpecialNeighbors(i, j, TypeSuperbreed)

				if superbreedNeighbors > 0 && neighbors == 2 {
					birthNeighbors = append(birthNeighbors, 2)
				}

				birth := false
				for _, n := range birthNeighbors {
					if neighbors == n {
						birth = true
						break
					}
				}

				if birth && cell.resources > 0.2 {
					nextCell.alive = true
					nextCell.age = 1
					nextCell.resources = cell.resources

					// Inherit traits
					if cell.chaosLevel > 0 {
						nextCell.cellType = TypePlague
					} else {
						plaguedNeighbors := g.CountSpecialNeighbors(i, j, TypePlague)
						cleanerNeighbors := g.CountSpecialNeighbors(i, j, TypeCleaner)

						if cleanerNeighbors > 0 && rand.Float32() < g.cleanerRate {
							nextCell.cellType = TypeCleaner
						} else if plaguedNeighbors > 0 && rand.Float32() < g.plagueRate {
							nextCell.cellType = TypePlague
						} else if superbreedNeighbors > 0 && rand.Float32() < 0.3 {
							nextCell.cellType = TypeSuperbreed
						} else {
							nextCell.cellType = TypeNormal
						}
					}
				} else {
					nextCell.alive = false
					nextCell.age = 0
					nextCell.cellType = TypeNormal
				}
			}
		}
	}

	// Swap grids
	g.grid, g.nextGrid = g.nextGrid, g.grid
	g.generation++
}

// GetCellColor returns the color for a cell based on type and age
func (g *Game) GetCellColor(cell *Cell) rl.Color {
	if !cell.alive {
		return rl.Black
	}

	normalizedAge := float32(math.Min(float64(cell.age), 100.0)) / 100.0
	if !g.showAging {
		normalizedAge = 0
	}

	var h, s, l float32

	switch cell.cellType {
	case TypePlague:
		h = 0 + normalizedAge*25     // Red to Red-Orange
		s = 100 - normalizedAge*15
		l = 55 - normalizedAge*10
	case TypeSuperbreed:
		h = 55 - normalizedAge*15    // Yellow to Gold
		s = 100 - normalizedAge*20
		l = 60 - normalizedAge*15
	case TypeCleaner:
		h = 180 - normalizedAge*20   // Cyan to Green
		s = 100 - normalizedAge*20
		l = 60 - normalizedAge*15
	case TypeMutated:
		h = 280 + normalizedAge*20   // Purple to Magenta
		s = 100 - normalizedAge*15
		l = 60 - normalizedAge*15
	default: // Normal
		h = 195 + normalizedAge*15   // Cyan to Blue (Neon theme)
		s = 100 - normalizedAge*20
		l = 60 - normalizedAge*15
	}

	return hslToRGB(h, s, l)
}

// hslToRGB converts HSL to RGB color
func hslToRGB(h, s, l float32) rl.Color {
	s /= 100
	l /= 100

	c := (1 - float32(math.Abs(float64(2*l-1)))) * s
	x := c * (1 - float32(math.Abs(math.Mod(float64(h/60), 2)-1)))
	m := l - c/2

	var r, g, b float32

	switch {
	case h < 60:
		r, g, b = c, x, 0
	case h < 120:
		r, g, b = x, c, 0
	case h < 180:
		r, g, b = 0, c, x
	case h < 240:
		r, g, b = 0, x, c
	case h < 300:
		r, g, b = x, 0, c
	default:
		r, g, b = c, 0, x
	}

	return rl.NewColor(
		uint8((r+m)*255),
		uint8((g+m)*255),
		uint8((b+m)*255),
		255,
	)
}

// Draw renders the game
func (g *Game) Draw() {
	// Draw cells
	for i := range g.grid {
		for j := range g.grid[i] {
			if g.grid[i][j].alive {
				color := g.GetCellColor(&g.grid[i][j])
				rl.DrawRectangle(
					int32(j*cellSize),
					int32(i*cellSize),
					cellSize,
					cellSize,
					color,
				)
			}
		}
	}

	// Draw grid lines
	if g.showGrid {
		for i := 0; i <= rows; i++ {
			rl.DrawLine(0, int32(i*cellSize), screenWidth, int32(i*cellSize), rl.NewColor(255, 255, 255, 10))
		}
		for j := 0; j <= cols; j++ {
			rl.DrawLine(int32(j*cellSize), 0, int32(j*cellSize), screenHeight, rl.NewColor(255, 255, 255, 10))
		}
	}

	// Draw UI
	statusText := fmt.Sprintf("Gen: %d | Speed: %d/s | FPS: %d | %s",
		g.generation, g.speed, rl.GetFPS(),
		map[bool]string{true: "PAUSED", false: "RUNNING"}[g.paused])
	rl.DrawText(statusText, 10, 10, 20, rl.White)

	helpText := "[SPACE] Play/Pause [R] Random [C] Clear [G] Grid [A] Aging [+/-] Speed [ESC] Quit"
	rl.DrawText(helpText, 10, screenHeight-30, 16, rl.White)
}

// Update handles game updates
func (g *Game) Update() {
	// Handle input
	if rl.IsKeyPressed(rl.KeySpace) {
		g.paused = !g.paused
	}
	if rl.IsKeyPressed(rl.KeyR) {
		g.Randomize()
	}
	if rl.IsKeyPressed(rl.KeyC) {
		g.Clear()
	}
	if rl.IsKeyPressed(rl.KeyG) {
		g.showGrid = !g.showGrid
	}
	if rl.IsKeyPressed(rl.KeyA) {
		g.showAging = !g.showAging
	}
	if rl.IsKeyPressed(rl.KeyEqual) || rl.IsKeyPressed(rl.KeyKpAdd) {
		g.speed = int(math.Min(float64(g.speed+5), 60))
	}
	if rl.IsKeyPressed(rl.KeyMinus) || rl.IsKeyPressed(rl.KeyKpSubtract) {
		g.speed = int(math.Max(float64(g.speed-5), 1))
	}
	if rl.IsKeyPressed(rl.KeyS) {
		g.NextGeneration()
	}

	// Mouse drawing
	if rl.IsMouseButtonDown(rl.MouseLeftButton) {
		mouseX := rl.GetMouseX()
		mouseY := rl.GetMouseY()
		col := int(mouseX) / cellSize
		row := int(mouseY) / cellSize
		if row >= 0 && row < rows && col >= 0 && col < cols {
			g.grid[row][col].alive = true
			g.grid[row][col].age = 1
		}
	}
	if rl.IsMouseButtonDown(rl.MouseRightButton) {
		mouseX := rl.GetMouseX()
		mouseY := rl.GetMouseY()
		col := int(mouseX) / cellSize
		row := int(mouseY) / cellSize
		if row >= 0 && row < rows && col >= 0 && col < cols {
			g.grid[row][col].alive = false
			g.grid[row][col].age = 0
		}
	}

	// Update generation
	if !g.paused {
		updateInterval := time.Second / time.Duration(g.speed)
		if time.Since(g.lastUpdateTime) >= updateInterval {
			g.NextGeneration()
			g.lastUpdateTime = time.Now()
		}
	}
}

func main() {
	rand.Seed(time.Now().UnixNano())

	rl.SetConfigFlags(rl.FlagVsyncHint | rl.FlagMsaa4xHint)
	rl.InitWindow(screenWidth, screenHeight, "Advanced Game of Life - Go/Raylib")
	rl.SetTargetFPS(targetFPS)

	game := NewGame()
	game.Randomize()

	for !rl.WindowShouldClose() {
		game.Update()

		rl.BeginDrawing()
		rl.ClearBackground(rl.Black)
		game.Draw()
		rl.EndDrawing()
	}

	rl.CloseWindow()
}
