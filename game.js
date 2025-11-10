// Particle class for visual effects
class Particle {
    constructor(x, y, type, color) {
        this.x = x;
        this.y = y;
        this.type = type; // 'explosion', 'sparkle', 'death'
        this.color = color;
        this.life = 1.0;
        this.maxLife = type === 'explosion' ? 20 : 30;
        this.age = 0;

        // Random velocity
        const angle = Math.random() * Math.PI * 2;
        const speed = type === 'explosion' ? Math.random() * 3 + 2 : Math.random() * 1 + 0.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.size = type === 'explosion' ? Math.random() * 3 + 2 : Math.random() * 2 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95; // Friction
        this.vy *= 0.95;
        this.age++;
        this.life = 1 - (this.age / this.maxLife);
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;

        if (this.type === 'sparkle') {
            // Star shape
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Circle
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class GameOfLife {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Graph canvas
        this.graphCanvas = document.getElementById('populationGraph');
        this.graphCtx = this.graphCanvas ? this.graphCanvas.getContext('2d') : null;

        // Game state
        this.cellSize = 8;
        this.cols = 0;
        this.rows = 0;
        this.grid = [];
        this.cellAge = []; // Track how long cells have been alive
        this.cellPlagued = []; // Track plagued cells
        this.cellSuperbreed = []; // Track superbreed cells
        this.cellCleaner = []; // Track cleaner cells
        this.cellMutated = []; // Track mutated cells (hybrids)
        this.resources = []; // Track resource/energy levels
        this.chaosMarkers = []; // Track chaos/catastrophe affected areas
        this.nextGrid = [];
        this.isRunning = false;
        this.generation = 0;
        this.fps = 10;
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / this.fps;

        // Particle system
        this.particles = [];

        // Features
        this.showAging = true;
        this.showGrid = true;
        this.wrapEdges = true;

        // Advanced Features
        this.plagueRate = 0.25; // 25% infection chance
        this.cleanerRate = 0.30; // 30% cleaning chance
        this.catastropheImpact = 15; // Initial impact zone intensity
        this.catastropheCount = 0;
        this.animationTime = 0; // For pulsating animations
        this.mutationRate = 0.05; // 5% mutation chance

        // Population history for graph (store last 100 generations)
        this.populationHistory = [];
        this.maxHistoryLength = 100;

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
        // Set canvas size based on viewport and sidebar
        const sidebarWidth = 280;
        const maxWidth = window.innerWidth - sidebarWidth - 40;
        const maxHeight = window.innerHeight - 40;

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
        this.cellCleaner = this.createEmptyGrid();
        this.cellMutated = this.createEmptyGrid();
        this.chaosMarkers = this.createEmptyGrid();
        this.resources = this.createResourceGrid();
        this.nextGrid = this.createEmptyGrid();

        this.draw();
        this.updateStats();
    }

    createEmptyGrid() {
        return Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    }

    createResourceGrid() {
        // Initialize resources at 100% (value 1.0)
        return Array(this.rows).fill(null).map(() => Array(this.cols).fill(1.0));
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

        // Advanced Feature Buttons
        document.getElementById('triggerPlague').addEventListener('click', () => {
            this.triggerPlague();
        });

        document.getElementById('triggerSuperbreed').addEventListener('click', () => {
            this.triggerSuperbreed();
        });

        document.getElementById('triggerCleaner').addEventListener('click', () => {
            this.triggerCleaner();
        });

        document.getElementById('triggerChaos').addEventListener('click', () => {
            this.triggerCatastrophe();
        });

        const plagueRateSlider = document.getElementById('plagueRate');
        plagueRateSlider.addEventListener('input', (e) => {
            this.plagueRate = parseInt(e.target.value) / 100;
            document.getElementById('plagueRateValue').textContent = e.target.value;
        });

        const cleanerRateSlider = document.getElementById('cleanerRate');
        cleanerRateSlider.addEventListener('input', (e) => {
            this.cleanerRate = parseInt(e.target.value) / 100;
            document.getElementById('cleanerRateValue').textContent = e.target.value;
        });

        const catastropheImpactSlider = document.getElementById('catastropheImpact');
        catastropheImpactSlider.addEventListener('input', (e) => {
            this.catastropheImpact = parseInt(e.target.value);
            document.getElementById('catastropheImpactValue').textContent = e.target.value;
        });

        const mutationRateSlider = document.getElementById('mutationRate');
        mutationRateSlider.addEventListener('input', (e) => {
            this.mutationRate = parseInt(e.target.value) / 100;
            document.getElementById('mutationRateValue').textContent = e.target.value;
        });

        // Collapsible sections
        document.querySelectorAll('.section-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const section = toggle.dataset.section;
                const content = document.getElementById(section);
                const isActive = toggle.classList.contains('active');

                if (isActive) {
                    toggle.classList.remove('active');
                    content.classList.remove('active');
                } else {
                    toggle.classList.add('active');
                    content.classList.add('active');
                }
            });
        });

        // Theme buttons
        document.querySelectorAll('.btn-theme-compact').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-theme-compact').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const theme = btn.dataset.theme;
                this.setTheme(theme);
            });
        });

        // Pattern buttons
        document.querySelectorAll('.btn-pattern-compact').forEach(btn => {
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
                this.cellCleaner[row][col] = 0;
                this.cellMutated[row][col] = 0;
                this.chaosMarkers[row][col] = 0;
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
        this.cellCleaner = this.createEmptyGrid();
        this.cellMutated = this.createEmptyGrid();
        this.chaosMarkers = this.createEmptyGrid();
        this.resources = this.createResourceGrid();
        this.generation = 0;
        this.catastropheCount = 0;
        this.particles = [];
        this.populationHistory = [];
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
                this.cellCleaner[row][col] = 0;
                this.cellMutated[row][col] = 0;
                this.chaosMarkers[row][col] = 0;
            }
        }
        this.generation = 0;
        this.catastropheCount = 0;
        this.particles = [];
        this.populationHistory = [];
        this.draw();
        this.updateStats();
    }

    triggerPlague() {
        // Infect 25% of living cells - more visible impact
        let infectedCount = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 1 && Math.random() < 0.25) {
                    this.cellPlagued[row][col] = 1;
                    this.cellSuperbreed[row][col] = 0;
                    this.cellCleaner[row][col] = 0;
                    infectedCount++;
                }
            }
        }
        this.draw();
        this.updateStats();
    }

    triggerSuperbreed() {
        // Enhance 20% of living cells - more visible impact
        let enhancedCount = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 1 && Math.random() < 0.20) {
                    this.cellSuperbreed[row][col] = 1;
                    this.cellPlagued[row][col] = 0;
                    this.cellCleaner[row][col] = 0;
                    enhancedCount++;
                }
            }
        }
        this.draw();
        this.updateStats();
    }

    triggerCleaner() {
        // Deploy cleaners to 15% of living cells - more visible impact
        let deployedCount = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 1 && Math.random() < 0.15) {
                    this.cellCleaner[row][col] = 1;
                    this.cellPlagued[row][col] = 0;
                    this.cellSuperbreed[row][col] = 0;
                    deployedCount++;
                }
            }
        }
        this.draw();
        this.updateStats();
    }

    triggerCatastrophe() {
        // Random catastrophe - kill cells and create infection zone
        const centerRow = Math.floor(Math.random() * this.rows);
        const centerCol = Math.floor(Math.random() * this.cols);
        const radius = Math.floor(Math.random() * 10) + 10; // Radius 10-20 for bigger impact

        // Create explosion particles at center
        const centerX = centerCol * this.cellSize + this.cellSize / 2;
        const centerY = centerRow * this.cellSize + this.cellSize / 2;
        for (let i = 0; i < 30; i++) {
            const color = ['#ff00ff', '#ff0088', '#ff0000', '#ff8800'][Math.floor(Math.random() * 4)];
            this.particles.push(new Particle(centerX, centerY, 'explosion', color));
        }

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const distance = Math.sqrt(
                    Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2)
                );
                if (distance <= radius) {
                    // Create death particles for destroyed cells
                    if (this.grid[row][col] === 1 && Math.random() < 0.1) {
                        const x = col * this.cellSize + this.cellSize / 2;
                        const y = row * this.cellSize + this.cellSize / 2;
                        this.particles.push(new Particle(x, y, 'death', '#888888'));
                    }

                    // Kill all cells in impact zone
                    this.grid[row][col] = 0;
                    this.cellAge[row][col] = 0;
                    this.cellPlagued[row][col] = 0;
                    this.cellSuperbreed[row][col] = 0;
                    this.cellCleaner[row][col] = 0;
                    this.cellMutated[row][col] = 0;

                    // Set chaos marker intensity based on distance from center
                    const intensity = Math.max(0, this.catastropheImpact * (1 - distance / radius));
                    this.chaosMarkers[row][col] = Math.floor(intensity);
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
        // Decay chaos markers slowly
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.chaosMarkers[row][col] > 0) {
                    this.chaosMarkers[row][col] -= 0.5; // Slower decay for longer effect
                    if (this.chaosMarkers[row][col] < 0) {
                        this.chaosMarkers[row][col] = 0;
                    }
                }

                // Regenerate resources slowly (0.5% per generation)
                if (this.resources[row][col] < 1.0) {
                    this.resources[row][col] = Math.min(1.0, this.resources[row][col] + 0.005);
                }
            }
        }

        // Create temporary arrays for next generation states
        const nextPlagued = this.createEmptyGrid();
        const nextSuperbreed = this.createEmptyGrid();
        const nextCleaner = this.createEmptyGrid();
        const nextMutated = this.createEmptyGrid();

        // Create next generation
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const neighbors = this.countNeighbors(row, col);
                const currentState = this.grid[row][col];
                const isPlagued = this.cellPlagued[row][col] === 1;
                const isSuperbreed = this.cellSuperbreed[row][col] === 1;
                const isCleaner = this.cellCleaner[row][col] === 1;
                const isMutated = this.cellMutated[row][col] === 1;

                // Modified Conway's rules with advanced features
                if (currentState === 1) {
                    // Consume resources (living cells use energy)
                    const consumption = isPlagued ? 0.02 : 0.01; // Plagued cells consume more
                    this.resources[row][col] = Math.max(0, this.resources[row][col] - consumption);

                    // Cell is alive
                    let surviveNeighbors = [2, 3];

                    // Superbreed cells survive with less neighbors
                    if (isSuperbreed || isMutated) {
                        surviveNeighbors = [1, 2, 3, 4];
                    }

                    // Low resources make survival harder
                    const resourcePenalty = this.resources[row][col] < 0.3 ? Math.random() < 0.3 : false;

                    if (surviveNeighbors.includes(neighbors) && !resourcePenalty) {
                        this.nextGrid[row][col] = 1;
                        this.cellAge[row][col]++;

                        // Create sparkle particles for cleaner cells occasionally
                        if (isCleaner && Math.random() < 0.05) {
                            const x = col * this.cellSize + this.cellSize / 2;
                            const y = row * this.cellSize + this.cellSize / 2;
                            this.particles.push(new Particle(x, y, 'sparkle', '#48dbfb'));
                        }

                        // Cleaner cells clean neighbors
                        const cleanerNeighbors = this.countCleanerNeighbors(row, col);

                        if (isCleaner || cleanerNeighbors > 0) {
                            // Cleaner restores order
                            nextCleaner[row][col] = 1;
                            nextPlagued[row][col] = 0;
                            nextSuperbreed[row][col] = 0;
                            nextMutated[row][col] = 0;
                        } else {
                            // Copy cell states
                            nextPlagued[row][col] = isPlagued ? 1 : 0;
                            nextSuperbreed[row][col] = isSuperbreed ? 1 : 0;
                            nextCleaner[row][col] = 0;
                            nextMutated[row][col] = isMutated ? 1 : 0;

                            // Mutation chance - cells can mutate to gain hybrid properties
                            if (!isMutated && Math.random() < this.mutationRate) {
                                nextMutated[row][col] = 1;
                                // Mutated cells keep their original specialty
                            }
                        }

                        // Plague kills cells after some time
                        if (isPlagued) {
                            if (this.cellAge[row][col] > 5 && Math.random() < 0.4) {
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
                        nextCleaner[row][col] = 0;
                        nextMutated[row][col] = 0;
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

                    if (birthNeighbors.includes(neighbors) && this.resources[row][col] > 0.2) {
                        this.nextGrid[row][col] = 1;
                        this.cellAge[row][col] = 1;

                        // Cells born in chaos zones are automatically plagued
                        if (this.chaosMarkers[row][col] > 0) {
                            nextPlagued[row][col] = 1;
                            nextCleaner[row][col] = 0;
                            nextSuperbreed[row][col] = 0;
                            nextMutated[row][col] = 0;
                        } else {
                            // Inherit traits from neighbors
                            const plaguedNeighbors = this.countPlaguedNeighbors(row, col);
                            const cleanerNeighbors = this.countCleanerNeighbors(row, col);

                            // Cleaner takes priority
                            if (cleanerNeighbors > 0 && Math.random() < this.cleanerRate) {
                                nextCleaner[row][col] = 1;
                                nextPlagued[row][col] = 0;
                                nextSuperbreed[row][col] = 0;
                                nextMutated[row][col] = 0;
                            } else if (plaguedNeighbors > 0) {
                                // Plague spreads to new cells
                                nextPlagued[row][col] = Math.random() < this.plagueRate ? 1 : 0;
                                nextMutated[row][col] = 0;
                            } else if (superbreedNeighbors > 0) {
                                // Superbreed trait can be inherited
                                nextSuperbreed[row][col] = Math.random() < 0.3 ? 1 : 0;
                                nextMutated[row][col] = 0;
                            }
                        }
                    } else {
                        this.nextGrid[row][col] = 0;
                        this.cellAge[row][col] = 0;
                        nextPlagued[row][col] = 0;
                        nextSuperbreed[row][col] = 0;
                        nextCleaner[row][col] = 0;
                        nextMutated[row][col] = 0;
                    }
                }
            }
        }

        // Spread plague to neighboring living cells
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.nextGrid[row][col] === 1 && nextPlagued[row][col] === 0 && nextCleaner[row][col] === 0) {
                    const plaguedNeighbors = this.countPlaguedNeighbors(row, col);
                    if (plaguedNeighbors > 0 && Math.random() < this.plagueRate) {
                        nextPlagued[row][col] = 1;
                        nextSuperbreed[row][col] = 0; // Plague overrides superbreed
                    }
                }
            }
        }

        // Swap grids
        [this.grid, this.nextGrid] = [this.nextGrid, this.grid];
        this.cellPlagued = nextPlagued;
        this.cellSuperbreed = nextSuperbreed;
        this.cellCleaner = nextCleaner;
        this.cellMutated = nextMutated;
        this.generation++;
        this.updateStats();
    }

    countCleanerNeighbors(row, col) {
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

                if (this.grid[newRow][newCol] === 1 && this.cellCleaner[newRow][newCol] === 1) {
                    count++;
                }
            }
        }
        return count;
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
        // Cleaner cells are cyan/blue (highest priority for cleanliness)
        if (this.cellCleaner[row][col] === 1) {
            const cleanerColors = ['#48dbfb', '#0abde3', '#1e90ff', '#00bfff', '#87ceeb'];
            if (this.showAging && age > 0) {
                const maxAge = 20;
                const normalizedAge = Math.min(age, maxAge) / maxAge;
                const colorIndex = Math.min(Math.floor(normalizedAge * cleanerColors.length), cleanerColors.length - 1);
                return cleanerColors[colorIndex];
            }
            return cleanerColors[0];
        }

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

        // Mutated cells are purple/violet (hybrid cells)
        if (this.cellMutated[row][col] === 1) {
            const mutatedColors = ['#a855f7', '#9333ea', '#7c3aed', '#6d28d9', '#5b21b6'];
            if (this.showAging && age > 0) {
                const maxAge = 20;
                const normalizedAge = Math.min(age, maxAge) / maxAge;
                const colorIndex = Math.min(Math.floor(normalizedAge * mutatedColors.length), mutatedColors.length - 1);
                return mutatedColors[colorIndex];
            }
            return mutatedColors[0];
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

        // Draw chaos markers (intense neon glow effects)
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.chaosMarkers[row][col] > 0) {
                    const x = col * this.cellSize + this.cellSize / 2;
                    const y = row * this.cellSize + this.cellSize / 2;
                    const intensity = Math.min(this.chaosMarkers[row][col] / this.catastropheImpact, 1);

                    // Intense neon glow effect for chaos - highly visible
                    const glowRadius = this.cellSize * 2;
                    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, glowRadius);

                    // Pulsating effect based on animation time
                    const pulsePhase = (this.animationTime % 800) / 800;
                    const pulse = Math.sin(pulsePhase * Math.PI * 2) * 0.2 + 0.8;

                    gradient.addColorStop(0, `rgba(255, 0, 255, ${intensity * 0.8 * pulse})`);
                    gradient.addColorStop(0.3, `rgba(255, 50, 200, ${intensity * 0.6 * pulse})`);
                    gradient.addColorStop(0.6, `rgba(0, 255, 255, ${intensity * 0.4 * pulse})`);
                    gradient.addColorStop(1, 'rgba(255, 0, 255, 0)');

                    this.ctx.fillStyle = gradient;
                    this.ctx.fillRect(
                        col * this.cellSize - glowRadius,
                        row * this.cellSize - glowRadius,
                        glowRadius * 2,
                        glowRadius * 2
                    );
                }
            }
        }

        // Draw cells with different shapes
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 1) {
                    const x = col * this.cellSize;
                    const y = row * this.cellSize;
                    const centerX = x + this.cellSize / 2;
                    const centerY = y + this.cellSize / 2;
                    const age = this.cellAge[row][col];
                    const color = this.getCellColor(row, col, age);

                    this.ctx.fillStyle = color;

                    // Different shapes for different cell types
                    if (this.cellCleaner[row][col] === 1) {
                        // Pulsating circle for cleaner
                        const pulsePhase = (this.animationTime % 1000) / 1000; // 0 to 1
                        const pulse = Math.sin(pulsePhase * Math.PI * 2) * 0.15 + 1; // 0.85 to 1.15
                        const radius = (this.cellSize / 2 - 1) * pulse;

                        this.ctx.shadowBlur = 15 * pulse;
                        this.ctx.shadowColor = color;

                        this.ctx.beginPath();
                        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                        this.ctx.fill();

                        this.ctx.shadowBlur = 0;
                    } else if (this.cellPlagued[row][col] === 1) {
                        // Circle for plague
                        this.ctx.shadowBlur = 8;
                        this.ctx.shadowColor = color;

                        this.ctx.beginPath();
                        this.ctx.arc(centerX, centerY, this.cellSize / 2 - 1, 0, Math.PI * 2);
                        this.ctx.fill();

                        this.ctx.shadowBlur = 0;
                    } else if (this.cellSuperbreed[row][col] === 1) {
                        // Diamond/star for superbreed
                        this.ctx.shadowBlur = 10;
                        this.ctx.shadowColor = color;

                        const size = this.cellSize / 2 - 1;
                        this.ctx.beginPath();
                        this.ctx.moveTo(centerX, centerY - size);
                        this.ctx.lineTo(centerX + size, centerY);
                        this.ctx.lineTo(centerX, centerY + size);
                        this.ctx.lineTo(centerX - size, centerY);
                        this.ctx.closePath();
                        this.ctx.fill();

                        this.ctx.shadowBlur = 0;
                    } else if (this.cellMutated[row][col] === 1) {
                        // Hexagon for mutated cells
                        this.ctx.shadowBlur = 12;
                        this.ctx.shadowColor = color;

                        const size = this.cellSize / 2 - 1;
                        this.ctx.beginPath();
                        for (let i = 0; i < 6; i++) {
                            const angle = (Math.PI / 3) * i;
                            const px = centerX + size * Math.cos(angle);
                            const py = centerY + size * Math.sin(angle);
                            if (i === 0) this.ctx.moveTo(px, py);
                            else this.ctx.lineTo(px, py);
                        }
                        this.ctx.closePath();
                        this.ctx.fill();

                        this.ctx.shadowBlur = 0;
                    } else {
                        // Square for normal cells
                        this.ctx.shadowBlur = 10;
                        this.ctx.shadowColor = color;

                        this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);

                        this.ctx.shadowBlur = 0;
                    }
                }
            }
        }

        // Draw particles (visual effects)
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.draw(this.ctx);
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
        let cleanerCount = 0;
        let mutatedCount = 0;
        let totalResources = 0;
        let cellCount = this.rows * this.cols;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                totalResources += this.resources[row][col];
                if (this.grid[row][col] === 1) {
                    population++;
                    if (this.cellPlagued[row][col] === 1) {
                        plaguedCount++;
                    }
                    if (this.cellSuperbreed[row][col] === 1) {
                        superbreedCount++;
                    }
                    if (this.cellCleaner[row][col] === 1) {
                        cleanerCount++;
                    }
                    if (this.cellMutated[row][col] === 1) {
                        mutatedCount++;
                    }
                }
            }
        }

        const avgResources = Math.round((totalResources / cellCount) * 100);

        document.getElementById('generation').textContent = this.generation;
        document.getElementById('population').textContent = population;
        document.getElementById('plaguedCells').textContent = plaguedCount;
        document.getElementById('superbreedCells').textContent = superbreedCount;
        document.getElementById('cleanerCells').textContent = cleanerCount;
        document.getElementById('mutatedCells').textContent = mutatedCount;
        document.getElementById('catastropheCount').textContent = this.catastropheCount;
        document.getElementById('avgResources').textContent = avgResources;

        // Update population history for graph
        this.populationHistory.push(population);
        if (this.populationHistory.length > this.maxHistoryLength) {
            this.populationHistory.shift();
        }

        // Draw population graph
        this.drawGraph();
    }

    drawGraph() {
        if (!this.graphCtx) return;

        const width = this.graphCanvas.width;
        const height = this.graphCanvas.height;
        const padding = 10;

        // Clear graph
        this.graphCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.graphCtx.fillRect(0, 0, width, height);

        if (this.populationHistory.length < 2) return;

        // Find min and max for scaling
        const maxPop = Math.max(...this.populationHistory, 1);
        const minPop = Math.min(...this.populationHistory, 0);
        const range = maxPop - minPop || 1;

        // Draw grid lines
        this.graphCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.graphCtx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const y = padding + (height - padding * 2) * (i / 4);
            this.graphCtx.beginPath();
            this.graphCtx.moveTo(padding, y);
            this.graphCtx.lineTo(width - padding, y);
            this.graphCtx.stroke();
        }

        // Draw population line
        this.graphCtx.strokeStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary-color') || '#00f0ff';
        this.graphCtx.lineWidth = 2;
        this.graphCtx.beginPath();

        const dataPoints = this.populationHistory.length;
        const xStep = (width - padding * 2) / (this.maxHistoryLength - 1);

        for (let i = 0; i < dataPoints; i++) {
            const x = padding + xStep * i;
            const normalizedValue = (this.populationHistory[i] - minPop) / range;
            const y = height - padding - (height - padding * 2) * normalizedValue;

            if (i === 0) {
                this.graphCtx.moveTo(x, y);
            } else {
                this.graphCtx.lineTo(x, y);
            }
        }

        this.graphCtx.stroke();

        // Draw current value text
        this.graphCtx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary-color') || '#00f0ff';
        this.graphCtx.font = '12px monospace';
        this.graphCtx.fillText(`Max: ${maxPop}`, padding + 5, padding + 12);
    }

    animate(currentTime = 0) {
        requestAnimationFrame((time) => this.animate(time));

        // Update animation time for pulsating effects
        this.animationTime = currentTime;

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update()) {
                this.particles.splice(i, 1);
            }
        }

        // Always redraw for pulsating animation
        this.draw();

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
