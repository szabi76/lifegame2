// Web Worker for parallel game computation
// Handles next generation calculation off the main thread for better performance

class GameWorker {
    constructor() {
        this.grid = null;
        this.nextGrid = null;
        this.cellAge = null;
        this.cellPlagued = null;
        this.cellSuperbreed = null;
        this.cellCleaner = null;
        this.cellMutated = null;
        this.resources = null;
        this.chaosMarkers = null;
        this.rows = 0;
        this.cols = 0;
        this.wrapEdges = true;
        this.plagueRate = 0.25;
        this.cleanerRate = 0.30;
        this.mutationRate = 0.05;
    }

    initialize(data) {
        this.rows = data.rows;
        this.cols = data.cols;
        this.wrapEdges = data.wrapEdges;
        this.plagueRate = data.plagueRate;
        this.cleanerRate = data.cleanerRate;
        this.mutationRate = data.mutationRate;

        // Initialize grids
        this.grid = this.createEmptyGrid();
        this.nextGrid = this.createEmptyGrid();
        this.cellAge = this.createEmptyGrid();
        this.cellPlagued = this.createEmptyGrid();
        this.cellSuperbreed = this.createEmptyGrid();
        this.cellCleaner = this.createEmptyGrid();
        this.cellMutated = this.createEmptyGrid();
        this.resources = this.createResourceGrid();
        this.chaosMarkers = this.createEmptyGrid();
    }

    createEmptyGrid() {
        return Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    }

    createResourceGrid() {
        return Array(this.rows).fill(null).map(() => Array(this.cols).fill(1.0));
    }

    updateGrids(data) {
        this.grid = data.grid;
        this.cellAge = data.cellAge;
        this.cellPlagued = data.cellPlagued;
        this.cellSuperbreed = data.cellSuperbreed;
        this.cellCleaner = data.cellCleaner;
        this.cellMutated = data.cellMutated;
        this.resources = data.resources;
        this.chaosMarkers = data.chaosMarkers;
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

    countSpecialNeighbors(row, col, specialGrid) {
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

                if (this.grid[newRow][newCol] === 1 && specialGrid[newRow][newCol] === 1) {
                    count++;
                }
            }
        }
        return count;
    }

    computeNextGeneration() {
        const startTime = performance.now();

        // Decay chaos markers and regenerate resources
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.chaosMarkers[row][col] > 0) {
                    this.chaosMarkers[row][col] -= 0.5;
                    if (this.chaosMarkers[row][col] < 0) {
                        this.chaosMarkers[row][col] = 0;
                    }
                }

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

        // Compute next generation
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const neighbors = this.countNeighbors(row, col);
                const currentState = this.grid[row][col];
                const isPlagued = this.cellPlagued[row][col] === 1;
                const isSuperbreed = this.cellSuperbreed[row][col] === 1;
                const isCleaner = this.cellCleaner[row][col] === 1;
                const isMutated = this.cellMutated[row][col] === 1;

                if (currentState === 1) {
                    // Cell is alive
                    const consumption = isPlagued ? 0.02 : 0.01;
                    this.resources[row][col] = Math.max(0, this.resources[row][col] - consumption);

                    let surviveNeighbors = [2, 3];
                    if (isSuperbreed || isMutated) {
                        surviveNeighbors = [1, 2, 3, 4];
                    }

                    const resourcePenalty = this.resources[row][col] < 0.3 ? Math.random() < 0.3 : false;

                    if (surviveNeighbors.includes(neighbors) && !resourcePenalty) {
                        this.nextGrid[row][col] = 1;
                        this.cellAge[row][col]++;

                        const cleanerNeighbors = this.countSpecialNeighbors(row, col, this.cellCleaner);

                        if (isCleaner || cleanerNeighbors > 0) {
                            nextCleaner[row][col] = 1;
                            nextPlagued[row][col] = 0;
                            nextSuperbreed[row][col] = 0;
                            nextMutated[row][col] = 0;
                        } else {
                            nextPlagued[row][col] = isPlagued ? 1 : 0;
                            nextSuperbreed[row][col] = isSuperbreed ? 1 : 0;
                            nextCleaner[row][col] = 0;
                            nextMutated[row][col] = isMutated ? 1 : 0;

                            if (!isMutated && Math.random() < this.mutationRate) {
                                nextMutated[row][col] = 1;
                            }
                        }

                        if (isPlagued && this.cellAge[row][col] > 5 && Math.random() < 0.4) {
                            this.nextGrid[row][col] = 0;
                            this.cellAge[row][col] = 0;
                            nextPlagued[row][col] = 0;
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
                    const superbreedNeighbors = this.countSpecialNeighbors(row, col, this.cellSuperbreed);

                    if (superbreedNeighbors > 0 && neighbors === 2) {
                        birthNeighbors.push(2);
                    }

                    if (birthNeighbors.includes(neighbors) && this.resources[row][col] > 0.2) {
                        this.nextGrid[row][col] = 1;
                        this.cellAge[row][col] = 1;

                        if (this.chaosMarkers[row][col] > 0) {
                            nextPlagued[row][col] = 1;
                            nextCleaner[row][col] = 0;
                            nextSuperbreed[row][col] = 0;
                            nextMutated[row][col] = 0;
                        } else {
                            const plaguedNeighbors = this.countSpecialNeighbors(row, col, this.cellPlagued);
                            const cleanerNeighbors = this.countSpecialNeighbors(row, col, this.cellCleaner);

                            if (cleanerNeighbors > 0 && Math.random() < this.cleanerRate) {
                                nextCleaner[row][col] = 1;
                                nextPlagued[row][col] = 0;
                                nextSuperbreed[row][col] = 0;
                                nextMutated[row][col] = 0;
                            } else if (plaguedNeighbors > 0) {
                                nextPlagued[row][col] = Math.random() < this.plagueRate ? 1 : 0;
                                nextMutated[row][col] = 0;
                            } else if (superbreedNeighbors > 0) {
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

        // Spread plague
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.nextGrid[row][col] === 1 && nextPlagued[row][col] === 0 && nextCleaner[row][col] === 0) {
                    const plaguedNeighbors = this.countSpecialNeighbors(row, col, this.cellPlagued);
                    if (plaguedNeighbors > 0 && Math.random() < this.plagueRate) {
                        nextPlagued[row][col] = 1;
                        nextSuperbreed[row][col] = 0;
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

        const computeTime = performance.now() - startTime;

        return {
            grid: this.grid,
            cellAge: this.cellAge,
            cellPlagued: this.cellPlagued,
            cellSuperbreed: this.cellSuperbreed,
            cellCleaner: this.cellCleaner,
            cellMutated: this.cellMutated,
            resources: this.resources,
            chaosMarkers: this.chaosMarkers,
            computeTime: computeTime
        };
    }
}

// Web Worker message handler
const worker = new GameWorker();

self.addEventListener('message', (e) => {
    const { type, data } = e.data;

    switch (type) {
        case 'initialize':
            worker.initialize(data);
            self.postMessage({ type: 'initialized' });
            break;

        case 'updateGrids':
            worker.updateGrids(data);
            self.postMessage({ type: 'gridsUpdated' });
            break;

        case 'computeNextGeneration':
            const result = worker.computeNextGeneration();
            self.postMessage({ type: 'generationComputed', data: result });
            break;

        case 'updateSettings':
            worker.wrapEdges = data.wrapEdges;
            worker.plagueRate = data.plagueRate;
            worker.cleanerRate = data.cleanerRate;
            worker.mutationRate = data.mutationRate;
            self.postMessage({ type: 'settingsUpdated' });
            break;
    }
});
