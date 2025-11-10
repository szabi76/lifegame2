class GameOfLife {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Game state
        this.cellSize = 8;
        this.cols = 0;
        this.rows = 0;
        this.grid = [];
        this.cellAge = []; // Track how long cells have been alive
        this.cellPlagued = []; // Track plagued cells
        this.cellSuperbreed = []; // Track superbreed cells
        this.nextGrid = [];
        this.isRunning = false;
        this.generation = 0;
        this.fps = 10;
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / this.fps;

        // Features
        this.showAging = true;
        this.showGrid = true;
        this.wrapEdges = true;

        // Advanced Features
        this.enablePlague = false;
        this.enableSuperbreed = false;
        this.enableCatastrophe = false;
        this.plagueRate = 0.15; // 15% infection chance
        this.catastropheChance = 0.01; // 1% chance per generation
        this.catastropheCount = 0;

        // Interaction
        this.isDrawing = false;
        this.lastCell = null;

        // Theme colors
        this.currentTheme = 'neon';
        this.themeColors = {
            neon: ['#00f0ff', '#00c8ff', '#00a0ff', '#0078ff', '#0050ff'],
            ocean: ['#00fff7', '#00d4ff', '#00a8ff', '#007cff', '#0050ff'],
            sunset: ['#ffd23f', '#ffb347', '#ff9447', '#ff7547', '#ff5647'],
            matrix: ['#39ff14', '#00ff41', '#00cc33', '#009925', '#006617'],
            fire: ['#ffa500', '#ff8c00', '#ff6347', '#ff4500', '#ff0000']
        };

        this.init();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        // Set canvas size
        const maxWidth = window.innerWidth > 1200 ? 1200 : window.innerWidth - 400;
        const maxHeight = window.innerHeight - 300;

        this.canvas.width = maxWidth;
        this.canvas.height = maxHeight;

        this.cols = Math.floor(this.canvas.width / this.cellSize);
        this.rows = Math.floor(this.canvas.height / this.cellSize);

        // Adjust canvas to fit exact grid
        this.canvas.width = this.cols * this.cellSize;
        this.canvas.height = this.rows * this.cellSize;

        // Initialize grids
        this.grid = this.createEmptyGrid();
        this.cellAge = this.createEmptyGrid();
        this.cellPlagued = this.createEmptyGrid();
        this.cellSuperbreed = this.createEmptyGrid();
        this.nextGrid = this.createEmptyGrid();

        this.draw();
        this.updateStats();
    }

    createEmptyGrid() {
        return Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    }

    setupEventListeners() {
        // Play/Pause
        document.getElementById('playPause').addEventListener('click', () => {
            this.togglePlay();
        });

        // Step
        document.getElementById('step').addEventListener('click', () => {
            if (!this.isRunning) {
                this.nextGeneration();
                this.draw();
            }
        });

        // Clear
        document.getElementById('clear').addEventListener('click', () => {
            this.clear();
        });

        // Random
        document.getElementById('random').addEventListener('click', () => {
            this.randomize();
        });

        // Speed control
        const speedSlider = document.getElementById('speed');
        speedSlider.addEventListener('input', (e) => {
            this.fps = parseInt(e.target.value);
            this.frameInterval = 1000 / this.fps;
            document.getElementById('speedValue').textContent = this.fps;
        });

        // Cell size control
        const cellSizeSlider = document.getElementById('cellSize');
        cellSizeSlider.addEventListener('input', (e) => {
            this.cellSize = parseInt(e.target.value);
            document.getElementById('cellSizeValue').textContent = this.cellSize;
            this.init();
        });

        // Feature toggles
        document.getElementById('showAging').addEventListener('change', (e) => {
            this.showAging = e.target.checked;
            this.draw();
        });

        document.getElementById('showGrid').addEventListener('change', (e) => {
            this.showGrid = e.target.checked;
            this.draw();
        });

        document.getElementById('wrapEdges').addEventListener('change', (e) => {
            this.wrapEdges = e.target.checked;
        });

        // Advanced Features
        document.getElementById('enablePlague').addEventListener('change', (e) => {
            this.enablePlague = e.target.checked;
        });

        document.getElementById('enableSuperbreed').addEventListener('change', (e) => {
            this.enableSuperbreed = e.target.checked;
        });

        document.getElementById('enableCatastrophe').addEventListener('change', (e) => {
            this.enableCatastrophe = e.target.checked;
        });

        document.getElementById('triggerPlague').addEventListener('click', () => {
            this.triggerPlague();
        });

        document.getElementById('triggerSuperbreed').addEventListener('click', () => {
            this.triggerSuperbreed();
        });

        const plagueRateSlider = document.getElementById('plagueRate');
        plagueRateSlider.addEventListener('input', (e) => {
            this.plagueRate = parseInt(e.target.value) / 100;
            document.getElementById('plagueRateValue').textContent = e.target.value;
        });

        const catastropheChanceSlider = document.getElementById('catastropheChance');
        catastropheChanceSlider.addEventListener('input', (e) => {
            this.catastropheChance = parseInt(e.target.value) / 100;
            document.getElementById('catastropheChanceValue').textContent = e.target.value;
        });

        // Theme buttons
        document.querySelectorAll('.btn-theme').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-theme').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const theme = btn.dataset.theme;
                this.setTheme(theme);
            });
        });

        // Pattern buttons
        document.querySelectorAll('.btn-pattern').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pattern = btn.dataset.pattern;
                this.loadPattern(pattern);
            });
        });

        // Canvas interaction
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());

        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleMouseUp();
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.init();
        });
    }

    handleMouseDown(e) {
        this.isDrawing = true;
        this.toggleCell(e);
    }

    handleMouseMove(e) {
        if (this.isDrawing) {
            this.toggleCell(e);
        }
    }

    handleMouseUp() {
        this.isDrawing = false;
        this.lastCell = null;
    }

    toggleCell(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);

        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            const cellKey = `${row},${col}`;
            if (this.lastCell !== cellKey) {
                this.grid[row][col] = this.grid[row][col] ? 0 : 1;
                if (this.grid[row][col]) {
                    this.cellAge[row][col] = 1;
                } else {
                    this.cellAge[row][col] = 0;
                }
                this.cellPlagued[row][col] = 0;
                this.cellSuperbreed[row][col] = 0;
                this.lastCell = cellKey;
                this.draw();
                this.updateStats();
            }
        }
    }

    togglePlay() {
        this.isRunning = !this.isRunning;
        const btn = document.getElementById('playPause');
        btn.textContent = this.isRunning ? '⏸ Pause' : '▶ Play';
        btn.classList.toggle('btn-primary');
        btn.classList.toggle('btn-secondary');
    }

    clear() {
        this.grid = this.createEmptyGrid();
        this.cellAge = this.createEmptyGrid();
        this.cellPlagued = this.createEmptyGrid();
        this.cellSuperbreed = this.createEmptyGrid();
        this.generation = 0;
        this.catastropheCount = 0;
        this.draw();
        this.updateStats();
    }

    randomize() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = Math.random() > 0.7 ? 1 : 0;
                this.cellAge[row][col] = this.grid[row][col] ? 1 : 0;
                this.cellPlagued[row][col] = 0;
                this.cellSuperbreed[row][col] = 0;
            }
        }
        this.generation = 0;
        this.catastropheCount = 0;
        this.draw();
        this.updateStats();
    }

    triggerPlague() {
        // Infect random cells
        let infectedCount = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 1 && Math.random() < 0.1) {
                    this.cellPlagued[row][col] = 1;
                    this.cellSuperbreed[row][col] = 0;
                    infectedCount++;
                }
            }
        }
        this.draw();
        this.updateStats();
    }

    triggerSuperbreed() {
        // Enhance random cells
        let enhancedCount = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 1 && Math.random() < 0.1) {
                    this.cellSuperbreed[row][col] = 1;
                    this.cellPlagued[row][col] = 0;
                    enhancedCount++;
                }
            }
        }
        this.draw();
        this.updateStats();
    }

    triggerCatastrophe() {
        // Random catastrophe - kill cells in a random area
        const centerRow = Math.floor(Math.random() * this.rows);
        const centerCol = Math.floor(Math.random() * this.cols);
        const radius = Math.floor(Math.random() * 10) + 5; // Radius 5-15

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const distance = Math.sqrt(
                    Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2)
                );
                if (distance <= radius) {
                    this.grid[row][col] = 0;
                    this.cellAge[row][col] = 0;
                    this.cellPlagued[row][col] = 0;
                    this.cellSuperbreed[row][col] = 0;
                }
            }
        }

        this.catastropheCount++;
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.body.className = `theme-${theme}`;
        this.draw();
    }

    loadPattern(patternName) {
        this.clear();
        const centerRow = Math.floor(this.rows / 2);
        const centerCol = Math.floor(this.cols / 2);

        const patterns = {
            glider: [
                [0, 1, 0],
                [0, 0, 1],
                [1, 1, 1]
            ],
            pulsar: [
                [0,0,1,1,1,0,0,0,1,1,1,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,0],
                [1,0,0,0,0,1,0,1,0,0,0,0,1],
                [1,0,0,0,0,1,0,1,0,0,0,0,1],
                [1,0,0,0,0,1,0,1,0,0,0,0,1],
                [0,0,1,1,1,0,0,0,1,1,1,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,1,1,1,0,0,0,1,1,1,0,0],
                [1,0,0,0,0,1,0,1,0,0,0,0,1],
                [1,0,0,0,0,1,0,1,0,0,0,0,1],
                [1,0,0,0,0,1,0,1,0,0,0,0,1],
                [0,0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,1,1,1,0,0,0,1,1,1,0,0]
            ],
            lwss: [
                [0,1,0,0,1],
                [1,0,0,0,0],
                [1,0,0,0,1],
                [1,1,1,1,0]
            ],
            gosperGun: [
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
                [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            ],
            pentadecathlon: [
                [0,0,1,0,0,0,0,1,0,0],
                [1,1,0,1,1,1,1,0,1,1],
                [0,0,1,0,0,0,0,1,0,0]
            ],
            acorn: [
                [0,1,0,0,0,0,0],
                [0,0,0,1,0,0,0],
                [1,1,0,0,1,1,1]
            ]
        };

        const pattern = patterns[patternName];
        if (!pattern) return;

        const startRow = centerRow - Math.floor(pattern.length / 2);
        const startCol = centerCol - Math.floor(pattern[0].length / 2);

        for (let i = 0; i < pattern.length; i++) {
            for (let j = 0; j < pattern[i].length; j++) {
                const row = startRow + i;
                const col = startCol + j;
                if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                    this.grid[row][col] = pattern[i][j];
                    this.cellAge[row][col] = pattern[i][j] ? 1 : 0;
                }
            }
        }

        this.draw();
        this.updateStats();
    }

    countNeighbors(row, col) {
        let count = 0;

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;

                let newRow = row + i;
                let newCol = col + j;

                if (this.wrapEdges) {
                    newRow = (newRow + this.rows) % this.rows;
                    newCol = (newCol + this.cols) % this.cols;
                } else {
                    if (newRow < 0 || newRow >= this.rows || newCol < 0 || newCol >= this.cols) {
                        continue;
                    }
                }

                count += this.grid[newRow][newCol];
            }
        }

        return count;
    }

    nextGeneration() {
        // Trigger catastrophe if enabled
        if (this.enableCatastrophe && Math.random() < this.catastropheChance) {
            this.triggerCatastrophe();
        }

        // Create temporary arrays for next generation states
        const nextPlagued = this.createEmptyGrid();
        const nextSuperbreed = this.createEmptyGrid();

        // Create next generation
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const neighbors = this.countNeighbors(row, col);
                const currentState = this.grid[row][col];
                const isPlagued = this.cellPlagued[row][col] === 1;
                const isSuperbreed = this.cellSuperbreed[row][col] === 1;

                // Modified Conway's rules with advanced features
                if (currentState === 1) {
                    // Cell is alive
                    let surviveNeighbors = [2, 3];

                    // Superbreed cells survive with less neighbors
                    if (isSuperbreed) {
                        surviveNeighbors = [1, 2, 3, 4];
                    }

                    if (surviveNeighbors.includes(neighbors)) {
                        this.nextGrid[row][col] = 1;
                        this.cellAge[row][col]++;

                        // Copy plague/superbreed state
                        nextPlagued[row][col] = isPlagued ? 1 : 0;
                        nextSuperbreed[row][col] = isSuperbreed ? 1 : 0;

                        // Plague kills cells after some time
                        if (isPlagued && this.enablePlague) {
                            if (this.cellAge[row][col] > 5 && Math.random() < 0.3) {
                                this.nextGrid[row][col] = 0;
                                this.cellAge[row][col] = 0;
                                nextPlagued[row][col] = 0;
                            }
                        }
                    } else {
                        this.nextGrid[row][col] = 0;
                        this.cellAge[row][col] = 0;
                        nextPlagued[row][col] = 0;
                        nextSuperbreed[row][col] = 0;
                    }
                } else {
                    // Cell is dead
                    let birthNeighbors = [3];

                    // Count superbreed neighbors
                    const superbreedNeighbors = this.countSuperbreedNeighbors(row, col);

                    // Superbreed neighbors can birth with 2 neighbors
                    if (superbreedNeighbors > 0 && neighbors === 2) {
                        birthNeighbors.push(2);
                    }

                    if (birthNeighbors.includes(neighbors)) {
                        this.nextGrid[row][col] = 1;
                        this.cellAge[row][col] = 1;

                        // Inherit traits from neighbors
                        const plaguedNeighbors = this.countPlaguedNeighbors(row, col);

                        if (this.enablePlague && plaguedNeighbors > 0) {
                            // Plague spreads to new cells
                            nextPlagued[row][col] = Math.random() < this.plagueRate ? 1 : 0;
                        }

                        if (this.enableSuperbreed && superbreedNeighbors > 0) {
                            // Superbreed trait can be inherited
                            nextSuperbreed[row][col] = Math.random() < 0.3 ? 1 : 0;
                        }
                    } else {
                        this.nextGrid[row][col] = 0;
                        this.cellAge[row][col] = 0;
                        nextPlagued[row][col] = 0;
                        nextSuperbreed[row][col] = 0;
                    }
                }
            }
        }

        // Spread plague to neighboring living cells
        if (this.enablePlague) {
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    if (this.nextGrid[row][col] === 1 && nextPlagued[row][col] === 0) {
                        const plaguedNeighbors = this.countPlaguedNeighbors(row, col);
                        if (plaguedNeighbors > 0 && Math.random() < this.plagueRate) {
                            nextPlagued[row][col] = 1;
                            nextSuperbreed[row][col] = 0; // Plague overrides superbreed
                        }
                    }
                }
            }
        }

        // Swap grids
        [this.grid, this.nextGrid] = [this.nextGrid, this.grid];
        this.cellPlagued = nextPlagued;
        this.cellSuperbreed = nextSuperbreed;
        this.generation++;
        this.updateStats();
    }

    countPlaguedNeighbors(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;

                let newRow = row + i;
                let newCol = col + j;

                if (this.wrapEdges) {
                    newRow = (newRow + this.rows) % this.rows;
                    newCol = (newCol + this.cols) % this.cols;
                } else {
                    if (newRow < 0 || newRow >= this.rows || newCol < 0 || newCol >= this.cols) {
                        continue;
                    }
                }

                if (this.grid[newRow][newCol] === 1 && this.cellPlagued[newRow][newCol] === 1) {
                    count++;
                }
            }
        }
        return count;
    }

    countSuperbreedNeighbors(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;

                let newRow = row + i;
                let newCol = col + j;

                if (this.wrapEdges) {
                    newRow = (newRow + this.rows) % this.rows;
                    newCol = (newCol + this.cols) % this.cols;
                } else {
                    if (newRow < 0 || newRow >= this.rows || newCol < 0 || newCol >= this.cols) {
                        continue;
                    }
                }

                if (this.grid[newRow][newCol] === 1 && this.cellSuperbreed[newRow][newCol] === 1) {
                    count++;
                }
            }
        }
        return count;
    }

    getCellColor(row, col, age) {
        // Plague cells are red/dark red
        if (this.cellPlagued[row][col] === 1) {
            const plagueColors = ['#ff6b6b', '#ee5a6f', '#e74c3c', '#c0392b', '#a93226'];
            if (this.showAging && age > 0) {
                const maxAge = 20;
                const normalizedAge = Math.min(age, maxAge) / maxAge;
                const colorIndex = Math.min(Math.floor(normalizedAge * plagueColors.length), plagueColors.length - 1);
                return plagueColors[colorIndex];
            }
            return plagueColors[0];
        }

        // Superbreed cells are gold/yellow
        if (this.cellSuperbreed[row][col] === 1) {
            const superbreedColors = ['#f9ca24', '#f0932b', '#ff9f43', '#ffa502', '#ff6348'];
            if (this.showAging && age > 0) {
                const maxAge = 20;
                const normalizedAge = Math.min(age, maxAge) / maxAge;
                const colorIndex = Math.min(Math.floor(normalizedAge * superbreedColors.length), superbreedColors.length - 1);
                return superbreedColors[colorIndex];
            }
            return superbreedColors[0];
        }

        // Normal cells use theme colors with aging
        if (!this.showAging || age === 0) {
            return this.themeColors[this.currentTheme][0];
        }

        const colors = this.themeColors[this.currentTheme];
        const maxAge = 20;
        const normalizedAge = Math.min(age, maxAge) / maxAge;
        const colorIndex = Math.min(Math.floor(normalizedAge * colors.length), colors.length - 1);

        return colors[colorIndex];
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw cells
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 1) {
                    const x = col * this.cellSize;
                    const y = row * this.cellSize;
                    const age = this.cellAge[row][col];

                    this.ctx.fillStyle = this.getCellColor(row, col, age);

                    // Add glow effect
                    this.ctx.shadowBlur = 10;
                    this.ctx.shadowColor = this.getCellColor(row, col, age);

                    this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);

                    this.ctx.shadowBlur = 0;
                }
            }
        }

        // Draw grid lines
        if (this.showGrid) {
            this.ctx.strokeStyle = getComputedStyle(document.documentElement)
                .getPropertyValue('--grid-color') || 'rgba(255, 255, 255, 0.05)';
            this.ctx.lineWidth = 0.5;

            for (let i = 0; i <= this.cols; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(i * this.cellSize, 0);
                this.ctx.lineTo(i * this.cellSize, this.canvas.height);
                this.ctx.stroke();
            }

            for (let i = 0; i <= this.rows; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, i * this.cellSize);
                this.ctx.lineTo(this.canvas.width, i * this.cellSize);
                this.ctx.stroke();
            }
        }
    }

    updateStats() {
        // Count population and cell types
        let population = 0;
        let plaguedCount = 0;
        let superbreedCount = 0;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 1) {
                    population++;
                    if (this.cellPlagued[row][col] === 1) {
                        plaguedCount++;
                    }
                    if (this.cellSuperbreed[row][col] === 1) {
                        superbreedCount++;
                    }
                }
            }
        }

        document.getElementById('generation').textContent = this.generation;
        document.getElementById('population').textContent = population;
        document.getElementById('plaguedCells').textContent = plaguedCount;
        document.getElementById('superbreedCells').textContent = superbreedCount;
        document.getElementById('catastropheCount').textContent = this.catastropheCount;
    }

    animate(currentTime = 0) {
        requestAnimationFrame((time) => this.animate(time));

        if (!this.isRunning) {
            this.lastFrameTime = currentTime;
            return;
        }

        const deltaTime = currentTime - this.lastFrameTime;

        if (deltaTime >= this.frameInterval) {
            this.nextGeneration();
            this.draw();

            // Update actual FPS
            const actualFps = Math.round(1000 / deltaTime);
            document.getElementById('actualFps').textContent = actualFps;

            this.lastFrameTime = currentTime - (deltaTime % this.frameInterval);
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new GameOfLife();
});
