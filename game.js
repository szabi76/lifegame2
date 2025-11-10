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

        // Graph canvases
        this.graphCanvas = document.getElementById('populationGraph');
        this.graphCtx = this.graphCanvas ? this.graphCanvas.getContext('2d') : null;
        this.barCanvas = document.getElementById('barChart');
        this.barCtx = this.barCanvas ? this.barCanvas.getContext('2d') : null;

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

        // Reaction-Diffusion System (Gray-Scott)
        this.rdEnabled = false;
        this.rdGridA = []; // Chemical A (nutrients)
        this.rdGridB = []; // Chemical B (toxins)
        this.rdOpacity = 0.5;
        this.feedRate = 0.055;
        this.killRate = 0.062;
        this.diffusionA = 1.0;
        this.diffusionB = 0.5;
        this.rdUpdateCounter = 0;
        this.rdUpdateFrequency = 2; // Update RD every N frames for performance

        // RD Presets (f, k, Da, Db)
        this.rdPresets = {
            coral: { f: 0.0545, k: 0.062, dA: 1.0, dB: 0.5 },
            mitosis: { f: 0.0367, k: 0.0649, dA: 1.0, dB: 0.5 },
            waves: { f: 0.014, k: 0.054, dA: 1.0, dB: 0.5 },
            maze: { f: 0.029, k: 0.057, dA: 1.0, dB: 0.5 },
            fingerprint: { f: 0.055, k: 0.062, dA: 1.0, dB: 0.5 }
        };

        // Population history for graph (store last 100 generations)
        this.populationHistory = {
            total: [],
            normal: [],
            plague: [],
            superbreed: [],
            cleaner: [],
            mutated: []
        };
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

        // Initialize RD grids
        this.initRDGrids();

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

    // Reaction-Diffusion Methods
    initRDGrids() {
        // Initialize chemical A (nutrients) with random perturbations
        this.rdGridA = Array(this.rows).fill(null).map(() =>
            Array(this.cols).fill(null).map(() => 1.0)
        );

        // Initialize chemical B (toxins) with small random seeds
        this.rdGridB = Array(this.rows).fill(null).map(() =>
            Array(this.cols).fill(null).map(() => 0.0)
        );

        // Add random seed patterns for B
        const numSeeds = Math.floor((this.rows * this.cols) / 100);
        for (let i = 0; i < numSeeds; i++) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            const radius = 2;

            for (let dr = -radius; dr <= radius; dr++) {
                for (let dc = -radius; dc <= radius; dc++) {
                    const r = row + dr;
                    const c = col + dc;
                    if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                        this.rdGridB[r][c] = 1.0;
                        this.rdGridA[r][c] = 0.0;
                    }
                }
            }
        }
    }

    resetRD() {
        this.initRDGrids();
    }

    applyRDPreset(presetName) {
        const preset = this.rdPresets[presetName];
        if (preset) {
            this.feedRate = preset.f;
            this.killRate = preset.k;
            this.diffusionA = preset.dA;
            this.diffusionB = preset.dB;

            // Update UI
            document.getElementById('feedRate').value = Math.round(preset.f * 1000);
            document.getElementById('killRate').value = Math.round(preset.k * 1000);
            document.getElementById('diffusionA').value = Math.round(preset.dA * 100);
            document.getElementById('diffusionB').value = Math.round(preset.dB * 100);

            document.getElementById('feedRateValue').textContent = preset.f.toFixed(3);
            document.getElementById('killRateValue').textContent = preset.k.toFixed(3);
            document.getElementById('diffusionAValue').textContent = preset.dA.toFixed(1);
            document.getElementById('diffusionBValue').textContent = preset.dB.toFixed(1);

            this.resetRD();
        }
    }

    updateRD() {
        if (!this.rdEnabled) return;

        // Performance optimization - update at lower frequency
        this.rdUpdateCounter++;
        if (this.rdUpdateCounter < this.rdUpdateFrequency) return;
        this.rdUpdateCounter = 0;

        const nextA = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
        const nextB = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));

        // Gray-Scott reaction-diffusion equations
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const a = this.rdGridA[row][col];
                const b = this.rdGridB[row][col];

                // Compute Laplacian (diffusion) using 9-point stencil
                let laplaceA = 0;
                let laplaceB = 0;

                // 9-point weighted stencil for better diffusion
                const weights = [
                    [0.05, 0.2, 0.05],
                    [0.2, -1.0, 0.2],
                    [0.05, 0.2, 0.05]
                ];

                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        let r = row + dr;
                        let c = col + dc;

                        // Wrap edges for toroidal topology
                        if (this.wrapEdges) {
                            r = (r + this.rows) % this.rows;
                            c = (c + this.cols) % this.cols;
                        } else {
                            if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) continue;
                        }

                        const weight = weights[dr + 1][dc + 1];
                        laplaceA += this.rdGridA[r][c] * weight;
                        laplaceB += this.rdGridB[r][c] * weight;
                    }
                }

                // Gray-Scott equations
                // dA/dt = Da * ∇²A - AB² + f(1-A)
                // dB/dt = Db * ∇²B + AB² - (k+f)B
                const reaction = a * b * b;
                const dA = this.diffusionA * laplaceA - reaction + this.feedRate * (1 - a);
                const dB = this.diffusionB * laplaceB + reaction - (this.killRate + this.feedRate) * b;

                // Update with time step (dt = 1.0 for stability)
                nextA[row][col] = Math.max(0, Math.min(1, a + dA));
                nextB[row][col] = Math.max(0, Math.min(1, b + dB));

                // Link to resource system: chemical A increases resources, B decreases
                if (this.rdEnabled) {
                    const resourceDelta = (nextA[row][col] - nextB[row][col]) * 0.002;
                    this.resources[row][col] = Math.max(0, Math.min(1,
                        this.resources[row][col] + resourceDelta
                    ));
                }
            }
        }

        // Cell influence on RD: living cells consume A and produce B
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 1) {
                    nextA[row][col] = Math.max(0, nextA[row][col] - 0.05);
                    nextB[row][col] = Math.min(1, nextB[row][col] + 0.03);
                }
            }
        }

        this.rdGridA = nextA;
        this.rdGridB = nextB;
    }

    renderRD() {
        if (!this.rdEnabled || this.rdOpacity <= 0) return;

        this.ctx.save();
        this.ctx.globalAlpha = this.rdOpacity;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const a = this.rdGridA[row][col];
                const b = this.rdGridB[row][col];

                // Color mapping: B chemical creates colorful patterns
                const intensity = b;
                const hue = (a * 180 + b * 180) % 360;
                const sat = 70 + b * 30;
                const light = 30 + intensity * 40;

                this.ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
                this.ctx.fillRect(
                    col * this.cellSize,
                    row * this.cellSize,
                    this.cellSize,
                    this.cellSize
                );
            }
        }

        this.ctx.restore();
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

        // Reaction-Diffusion Controls
        document.getElementById('enableRD').addEventListener('change', (e) => {
            this.rdEnabled = e.target.checked;
            this.draw();
        });

        document.getElementById('rdPreset').addEventListener('change', (e) => {
            this.applyRDPreset(e.target.value);
        });

        const rdOpacitySlider = document.getElementById('rdOpacity');
        rdOpacitySlider.addEventListener('input', (e) => {
            this.rdOpacity = parseInt(e.target.value) / 100;
            document.getElementById('rdOpacityValue').textContent = e.target.value;
            this.draw();
        });

        const feedRateSlider = document.getElementById('feedRate');
        feedRateSlider.addEventListener('input', (e) => {
            this.feedRate = parseInt(e.target.value) / 1000;
            document.getElementById('feedRateValue').textContent = this.feedRate.toFixed(3);
        });

        const killRateSlider = document.getElementById('killRate');
        killRateSlider.addEventListener('input', (e) => {
            this.killRate = parseInt(e.target.value) / 1000;
            document.getElementById('killRateValue').textContent = this.killRate.toFixed(3);
        });

        const diffusionASlider = document.getElementById('diffusionA');
        diffusionASlider.addEventListener('input', (e) => {
            this.diffusionA = parseInt(e.target.value) / 100;
            document.getElementById('diffusionAValue').textContent = this.diffusionA.toFixed(1);
        });

        const diffusionBSlider = document.getElementById('diffusionB');
        diffusionBSlider.addEventListener('input', (e) => {
            this.diffusionB = parseInt(e.target.value) / 100;
            document.getElementById('diffusionBValue').textContent = this.diffusionB.toFixed(1);
        });

        document.getElementById('resetRD').addEventListener('click', () => {
            this.resetRD();
            this.draw();
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
        this.populationHistory = {
            total: [],
            normal: [],
            plague: [],
            superbreed: [],
            cleaner: [],
            mutated: []
        };
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
        this.populationHistory = {
            total: [],
            normal: [],
            plague: [],
            superbreed: [],
            cleaner: [],
            mutated: []
        };
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

        // Update reaction-diffusion system
        this.updateRD();

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
        // New HSL-based aging system with hue dynamics
        // Max lifecycle: 100 ticks, aging factor: 5 ticks
        const maxAge = 100;
        let normalizedAge = Math.min(age, maxAge) / maxAge; // 0.0 to 1.0

        if (!this.showAging || age === 0) {
            normalizedAge = 0;
        }

        // Cleaner cells: Cyan to Green spectrum (180° → 160°)
        if (this.cellCleaner[row][col] === 1) {
            const startHue = 180; // Bright cyan
            const endHue = 160;   // Cyan-green
            const hue = startHue - (startHue - endHue) * normalizedAge;
            const saturation = 100 - (normalizedAge * 20); // 100% → 80%
            const lightness = 60 - (normalizedAge * 15);   // 60% → 45%
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        }

        // Plague cells: Red to Red-Orange spectrum (0° → 25°)
        if (this.cellPlagued[row][col] === 1) {
            const startHue = 0;   // Pure red
            const endHue = 25;    // Red-orange
            const hue = startHue + (endHue - startHue) * normalizedAge;
            const saturation = 100 - (normalizedAge * 15); // 100% → 85%
            const lightness = 55 - (normalizedAge * 10);   // 55% → 45%
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        }

        // Superbreed cells: Yellow to Gold spectrum (55° → 40°)
        if (this.cellSuperbreed[row][col] === 1) {
            const startHue = 55;  // Bright yellow
            const endHue = 40;    // Gold-orange
            const hue = startHue - (startHue - endHue) * normalizedAge;
            const saturation = 100 - (normalizedAge * 20); // 100% → 80%
            const lightness = 60 - (normalizedAge * 15);   // 60% → 45%
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        }

        // Mutated cells: Purple to Magenta spectrum (280° → 300°)
        if (this.cellMutated[row][col] === 1) {
            const startHue = 280; // Purple
            const endHue = 300;   // Magenta
            const hue = startHue + (endHue - startHue) * normalizedAge;
            const saturation = 100 - (normalizedAge * 15); // 100% → 85%
            const lightness = 60 - (normalizedAge * 15);   // 60% → 45%
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        }

        // Normal cells: Blue to Cyan spectrum (210° → 185°) for theme colors
        // Use theme colors as base but apply aging with hue shift
        if (this.currentTheme === 'neon') {
            const startHue = 195; // Bright cyan
            const endHue = 210;   // Blue-cyan
            const hue = startHue + (endHue - startHue) * normalizedAge;
            const saturation = 100 - (normalizedAge * 20);
            const lightness = 60 - (normalizedAge * 15);
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        } else if (this.currentTheme === 'ocean') {
            const startHue = 185;
            const endHue = 210;
            const hue = startHue + (endHue - startHue) * normalizedAge;
            const saturation = 100 - (normalizedAge * 20);
            const lightness = 60 - (normalizedAge * 15);
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        } else if (this.currentTheme === 'sunset') {
            const startHue = 45;  // Gold
            const endHue = 15;    // Orange-red
            const hue = startHue - (startHue - endHue) * normalizedAge;
            const saturation = 100 - (normalizedAge * 15);
            const lightness = 65 - (normalizedAge * 20);
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        } else if (this.currentTheme === 'matrix') {
            const startHue = 125; // Bright green
            const endHue = 140;   // Green
            const hue = startHue + (endHue - startHue) * normalizedAge;
            const saturation = 100 - (normalizedAge * 25);
            const lightness = 55 - (normalizedAge * 15);
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        } else if (this.currentTheme === 'fire') {
            const startHue = 35;  // Orange
            const endHue = 0;     // Red
            const hue = startHue - (startHue - endHue) * normalizedAge;
            const saturation = 100 - (normalizedAge * 10);
            const lightness = 60 - (normalizedAge * 20);
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        }

        // Fallback
        return this.themeColors[this.currentTheme][0];
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Render reaction-diffusion as background layer
        this.renderRD();

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

                    // Different shapes for different cell types with enhanced glow effects
                    const isPlagued = this.cellPlagued[row][col] === 1;
                    const isSuperbreed = this.cellSuperbreed[row][col] === 1;
                    const isCleaner = this.cellCleaner[row][col] === 1;
                    const isMutated = this.cellMutated[row][col] === 1;
                    const isSpecial = isPlagued || isSuperbreed || isCleaner || isMutated;

                    if (isCleaner) {
                        // Pulsating circle for cleaner with strong glow
                        const pulsePhase = (this.animationTime % 1000) / 1000; // 0 to 1
                        const pulse = Math.sin(pulsePhase * Math.PI * 2) * 0.15 + 1; // 0.85 to 1.15
                        const radius = (this.cellSize / 2 - 1) * pulse;

                        // Enhanced glow effect for cleaner cells
                        this.ctx.shadowBlur = 20 * pulse;
                        this.ctx.shadowColor = color;

                        this.ctx.beginPath();
                        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                        this.ctx.fill();

                        this.ctx.shadowBlur = 0;
                    } else if (isPlagued) {
                        // Circle for plague with pulsing red glow
                        const pulsePhase = (this.animationTime % 1500) / 1500;
                        const pulse = Math.sin(pulsePhase * Math.PI * 2) * 0.3 + 1; // 0.7 to 1.3

                        this.ctx.shadowBlur = 15 * pulse;
                        this.ctx.shadowColor = color;

                        this.ctx.beginPath();
                        this.ctx.arc(centerX, centerY, this.cellSize / 2 - 1, 0, Math.PI * 2);
                        this.ctx.fill();

                        this.ctx.shadowBlur = 0;
                    } else if (isSuperbreed) {
                        // Diamond/star for superbreed with golden glow
                        const pulsePhase = (this.animationTime % 1200) / 1200;
                        const pulse = Math.sin(pulsePhase * Math.PI * 2) * 0.25 + 1; // 0.75 to 1.25

                        this.ctx.shadowBlur = 18 * pulse;
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
                    } else if (isMutated) {
                        // Hexagon for mutated cells with purple glow
                        const pulsePhase = (this.animationTime % 1800) / 1800;
                        const pulse = Math.sin(pulsePhase * Math.PI * 2) * 0.3 + 1; // 0.7 to 1.3

                        this.ctx.shadowBlur = 16 * pulse;
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
                        // Square for normal cells with subtle glow
                        this.ctx.shadowBlur = 8;
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
        const normalCount = population - plaguedCount - superbreedCount - cleanerCount - mutatedCount;

        document.getElementById('generation').textContent = this.generation;
        document.getElementById('population').textContent = population;
        document.getElementById('plaguedCells').textContent = plaguedCount;
        document.getElementById('superbreedCells').textContent = superbreedCount;
        document.getElementById('cleanerCells').textContent = cleanerCount;
        document.getElementById('mutatedCells').textContent = mutatedCount;
        document.getElementById('catastropheCount').textContent = this.catastropheCount;
        document.getElementById('avgResources').textContent = avgResources;

        // Update population history for graph (all cell types)
        this.populationHistory.total.push(population);
        this.populationHistory.normal.push(normalCount);
        this.populationHistory.plague.push(plaguedCount);
        this.populationHistory.superbreed.push(superbreedCount);
        this.populationHistory.cleaner.push(cleanerCount);
        this.populationHistory.mutated.push(mutatedCount);

        // Trim history to max length
        if (this.populationHistory.total.length > this.maxHistoryLength) {
            this.populationHistory.total.shift();
            this.populationHistory.normal.shift();
            this.populationHistory.plague.shift();
            this.populationHistory.superbreed.shift();
            this.populationHistory.cleaner.shift();
            this.populationHistory.mutated.shift();
        }

        // Draw graphs
        this.drawGraph();
        this.drawBarChart();
    }

    drawGraph() {
        if (!this.graphCtx) return;

        const width = this.graphCanvas.width;
        const height = this.graphCanvas.height;
        const padding = 10;

        // Clear graph
        this.graphCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.graphCtx.fillRect(0, 0, width, height);

        if (this.populationHistory.total.length < 2) return;

        // Find min and max for scaling across all cell types
        const allValues = [
            ...this.populationHistory.total,
            ...this.populationHistory.plague,
            ...this.populationHistory.superbreed,
            ...this.populationHistory.cleaner,
            ...this.populationHistory.mutated
        ];
        const maxPop = Math.max(...allValues, 1);
        const minPop = 0;
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

        const dataPoints = this.populationHistory.total.length;
        const xStep = (width - padding * 2) / (this.maxHistoryLength - 1);

        // Helper function to draw a line
        const drawLine = (data, color, lineWidth) => {
            this.graphCtx.strokeStyle = color;
            this.graphCtx.lineWidth = lineWidth;
            this.graphCtx.beginPath();

            for (let i = 0; i < dataPoints; i++) {
                const x = padding + xStep * i;
                const normalizedValue = (data[i] - minPop) / range;
                const y = height - padding - (height - padding * 2) * normalizedValue;

                if (i === 0) {
                    this.graphCtx.moveTo(x, y);
                } else {
                    this.graphCtx.lineTo(x, y);
                }
            }

            this.graphCtx.stroke();
        };

        // Draw lines for each cell type (thinner, semi-transparent)
        drawLine(this.populationHistory.plague, 'rgba(255, 107, 107, 0.8)', 1.5);    // Red
        drawLine(this.populationHistory.superbreed, 'rgba(249, 202, 36, 0.8)', 1.5); // Gold
        drawLine(this.populationHistory.cleaner, 'rgba(72, 219, 251, 0.8)', 1.5);    // Cyan
        drawLine(this.populationHistory.mutated, 'rgba(168, 85, 247, 0.8)', 1.5);    // Purple

        // Draw total population line (thicker, brighter)
        const primaryColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary-color') || '#00f0ff';
        drawLine(this.populationHistory.total, primaryColor, 2.5);

        // Draw legend and max value
        this.graphCtx.font = '10px monospace';
        const legendY = padding + 12;
        this.graphCtx.fillStyle = primaryColor;
        this.graphCtx.fillText(`Max: ${maxPop}`, padding + 5, legendY);
    }

    drawBarChart() {
        if (!this.barCtx) return;

        const width = this.barCanvas.width;
        const height = this.barCanvas.height;
        const padding = 15;

        // Clear canvas
        this.barCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.barCtx.fillRect(0, 0, width, height);

        if (this.populationHistory.total.length === 0) return;

        // Get current populations
        const idx = this.populationHistory.total.length - 1;
        const populations = {
            normal: this.populationHistory.normal[idx] || 0,
            plague: this.populationHistory.plague[idx] || 0,
            superbreed: this.populationHistory.superbreed[idx] || 0,
            cleaner: this.populationHistory.cleaner[idx] || 0,
            mutated: this.populationHistory.mutated[idx] || 0
        };

        const total = this.populationHistory.total[idx] || 1;
        const maxValue = total;

        // Bar configuration
        const bars = [
            { label: 'Normal', value: populations.normal, color: '#00f0ff', emoji: '⬜' },
            { label: 'Plague', value: populations.plague, color: '#ff6b6b', emoji: '🦠' },
            { label: 'Super', value: populations.superbreed, color: '#f9ca24', emoji: '⭐' },
            { label: 'Clean', value: populations.cleaner, color: '#48dbfb', emoji: '✨' },
            { label: 'Mutant', value: populations.mutated, color: '#a855f7', emoji: '🧬' }
        ];

        const barCount = bars.length;
        const barSpacing = 8;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2 - 20; // Leave space for labels
        const barWidth = (chartWidth - (barCount - 1) * barSpacing) / barCount;

        // Pulsating effect
        const pulsePhase = (this.animationTime % 1500) / 1500;
        const pulse = Math.sin(pulsePhase * Math.PI * 2) * 0.1 + 1; // 0.9 to 1.1

        bars.forEach((bar, index) => {
            const x = padding + index * (barWidth + barSpacing);
            const heightRatio = maxValue > 0 ? (bar.value / maxValue) : 0;
            const barHeight = chartHeight * heightRatio * pulse; // Apply pulsating effect
            const y = padding + chartHeight - barHeight;

            // Draw bar with gradient
            const gradient = this.barCtx.createLinearGradient(x, y, x, y + barHeight);
            gradient.addColorStop(0, bar.color);
            gradient.addColorStop(1, bar.color + '80'); // Add transparency

            this.barCtx.fillStyle = gradient;
            this.barCtx.fillRect(x, y, barWidth, barHeight);

            // Draw bar outline
            this.barCtx.strokeStyle = bar.color;
            this.barCtx.lineWidth = 1;
            this.barCtx.strokeRect(x, y, barWidth, barHeight);

            // Draw value on top of bar
            if (bar.value > 0) {
                this.barCtx.fillStyle = '#ffffff';
                this.barCtx.font = 'bold 10px monospace';
                this.barCtx.textAlign = 'center';
                this.barCtx.fillText(bar.value, x + barWidth / 2, y - 5);
            }

            // Draw label below bar
            this.barCtx.fillStyle = bar.color;
            this.barCtx.font = '9px monospace';
            this.barCtx.textAlign = 'center';
            this.barCtx.fillText(bar.emoji, x + barWidth / 2, height - padding + 12);
        });

        // Draw title
        this.barCtx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary-color') || '#00f0ff';
        this.barCtx.font = '10px monospace';
        this.barCtx.textAlign = 'left';
        this.barCtx.fillText(`Total: ${total}`, padding, padding - 2);
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

    // Book Modal Navigation
    const modal = document.getElementById('helpModal');
    const openBtn = document.getElementById('openHelp');
    const closeBtn = document.querySelector('.book-close');
    const overlay = document.querySelector('.modal-overlay');
    const prevBtn = document.querySelector('.nav-prev');
    const nextBtn = document.querySelector('.nav-next');
    const pages = document.querySelectorAll('.book-page');
    const dots = document.querySelectorAll('.dot');

    let currentPage = 1;
    const totalPages = pages.length;

    function showPage(pageNum) {
        // Hide all pages
        pages.forEach(page => page.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        // Show current page
        const currentPageEl = document.querySelector(`.book-page[data-page="${pageNum}"]`);
        if (currentPageEl) {
            currentPageEl.classList.add('active');
        }

        // Update dots
        if (dots[pageNum - 1]) {
            dots[pageNum - 1].classList.add('active');
        }

        // Update button states
        prevBtn.disabled = pageNum === 1;
        nextBtn.disabled = pageNum === totalPages;

        currentPage = pageNum;
    }

    function openModal() {
        modal.classList.add('active');
        showPage(1);
    }

    function closeModal() {
        modal.classList.remove('active');
    }

    // Event listeners
    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            showPage(currentPage - 1);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            showPage(currentPage + 1);
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return;

        if (e.key === 'Escape') {
            closeModal();
        } else if (e.key === 'ArrowLeft' && currentPage > 1) {
            showPage(currentPage - 1);
        } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
            showPage(currentPage + 1);
        }
    });

    // Click on dots to navigate
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showPage(index + 1);
        });
    });
});
