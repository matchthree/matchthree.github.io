import { Level, Move, Cluster, Tile } from './types';
import { GAME_CONFIG, GAME_STATES } from './config';
import { GameRenderer } from './renderer';

export class Game {
    private canvas: HTMLCanvasElement;
    private renderer: GameRenderer;
    private level: Level;
    private gameState: number;
    private score: number;
    private clusters: Cluster[];
    private moves: Move[];
    private animationState: number;
    private animationTime: number;
    private lastFrame: number = 0;
    private fpsTime: number = 0;
    private frameCount: number = 0;
    private fps: number = 0;

    private mouseX: number = 0;
    private mouseY: number = 0;
    private selectedTile: { column: number; row: number } | null = null;
    private isDragging: boolean = false;
    private currentMove: Move | null = null;
    private showMoves: boolean = false;
    private gameOver: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.renderer = new GameRenderer(canvas);
        this.level = this.initializeLevel();
        this.gameState = GAME_STATES.init;
        this.score = 0;
        this.clusters = [];
        this.moves = [];
        this.animationState = 0;
        this.animationTime = 0;
        
        // Bind event handlers
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseOut = this.handleMouseOut.bind(this);
        
        this.initializeEventListeners();
    }

    private initializeLevel(): Level {
        const level: Level = {
            x: GAME_CONFIG.INITIAL_LEVEL.x,
            y: GAME_CONFIG.INITIAL_LEVEL.y,
            columns: GAME_CONFIG.INITIAL_LEVEL.columns,
            rows: GAME_CONFIG.INITIAL_LEVEL.rows,
            tilewidth: GAME_CONFIG.INITIAL_LEVEL.tilewidth,
            tileheight: GAME_CONFIG.INITIAL_LEVEL.tileheight,
            tiles: []
        };

        // Create random tiles
        for (let i = 0; i < level.columns; i++) {
            level.tiles[i] = [];
            for (let j = 0; j < level.rows; j++) {
                level.tiles[i][j] = {
                    type: Math.floor(Math.random() * GAME_CONFIG.TILE_COLORS.length),
                    shift: 0
                };
            }
        }

        // Make sure there are no initial clusters
        while (this.findClusters(level).length > 0) {
            for (let i = 0; i < level.columns; i++) {
                for (let j = 0; j < level.rows; j++) {
                    level.tiles[i][j].type = Math.floor(Math.random() * GAME_CONFIG.TILE_COLORS.length);
                }
            }
        }

        return level;
    }

    private initializeEventListeners(): void {
        this.canvas.addEventListener("mousemove", this.handleMouseMove);
        this.canvas.addEventListener("mousedown", this.handleMouseDown);
        this.canvas.addEventListener("mouseup", this.handleMouseUp);
        this.canvas.addEventListener("mouseout", this.handleMouseOut);
    }

    public update(timestamp: number): void {
        // Calculate fps
        if (this.lastFrame === 0) {
            this.lastFrame = timestamp;
        }
        const dt = (timestamp - this.lastFrame) / 1000;
        this.lastFrame = timestamp;
        
        this.fpsTime += dt;
        this.frameCount++;
        
        if (this.fpsTime >= 1) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTime = 0;
            this.renderer.setFps(this.fps);
        }

        // Game state update
        if (this.gameState === GAME_STATES.ready) {
            // Find available moves
            this.findMoves();
            
            if (this.moves.length === 0) {
                this.gameOver = true;
            }
            
        } else if (this.gameState === GAME_STATES.resolve) {
            this.animationTime += dt;

            if (this.animationTime > GAME_CONFIG.ANIMATION_TIME_TOTAL) {
                // Check for clusters
                this.clusters = this.findClusters(this.level);
                
                if (this.clusters.length > 0) {
                    // Remove clusters and add score
                    this.removeClusters();
                    this.score += this.clusters.length * 100;
                    
                    // Shift tiles and add new ones
                    this.shiftTiles();
                    this.fillEmptyTiles();
                    
                    // Reset animation
                    this.animationTime = 0;
                } else {
                    // No clusters found, go back to ready state
                    this.gameState = GAME_STATES.ready;
                }
            }
        }
    }

    public render(): void {
        this.renderer.drawFrame(this.canvas);
        this.renderer.drawLevel(this.level, GAME_CONFIG.TILE_COLORS);
        this.renderer.drawButtons(GAME_CONFIG.BUTTONS);
        this.renderer.drawScore(this.score);
        
        if (this.showMoves && this.moves.length > 0) {
            this.renderer.drawMoves(this.moves, this.level);
        }
        
        if (this.gameOver) {
            this.renderer.drawGameOver();
        }
    }

    private handleMouseMove(event: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;

        if (this.isDragging && this.selectedTile && this.gameState === GAME_STATES.ready) {
            const column = Math.floor((this.mouseX - this.level.x) / this.level.tilewidth);
            const row = Math.floor((this.mouseY - this.level.y) / this.level.tileheight);

            if (this.isValidSwap(this.selectedTile.column, this.selectedTile.row, column, row)) {
                this.currentMove = {
                    column1: this.selectedTile.column,
                    row1: this.selectedTile.row,
                    column2: column,
                    row2: row
                };
                this.swapTiles(this.currentMove);
                this.gameState = GAME_STATES.resolve;
            }
        }
    }

    private handleMouseDown(event: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;

        const column = Math.floor((this.mouseX - this.level.x) / this.level.tilewidth);
        const row = Math.floor((this.mouseY - this.level.y) / this.level.tileheight);

        if (this.isValidPosition(column, row) && this.gameState === GAME_STATES.ready) {
            this.selectedTile = { column, row };
            this.isDragging = true;
        }

        // Check if a button was clicked
        for (let i = 0; i < GAME_CONFIG.BUTTONS.length; i++) {
            const button = GAME_CONFIG.BUTTONS[i];
            if (this.mouseX >= button.x && this.mouseX < button.x + button.width &&
                this.mouseY >= button.y && this.mouseY < button.y + button.height) {
                
                if (button.text === "New Game") {
                    this.newGame();
                } else if (button.text === "Show Moves") {
                    this.showMoves = !this.showMoves;
                }
            }
        }
    }

    private handleMouseUp(event: MouseEvent): void {
        this.isDragging = false;
        this.selectedTile = null;
        this.currentMove = null;
    }

    private handleMouseOut(event: MouseEvent): void {
        this.handleMouseUp(event);
    }

    private isValidPosition(column: number, row: number): boolean {
        return column >= 0 && column < this.level.columns &&
               row >= 0 && row < this.level.rows;
    }

    private isValidSwap(column1: number, row1: number, column2: number, row2: number): boolean {
        // Check if the tiles are adjacent
        return Math.abs(column1 - column2) + Math.abs(row1 - row2) === 1;
    }

    private swapTiles(move: Move): void {
        // Swap tiles
        const tile1 = this.level.tiles[move.column1][move.row1];
        const tile2 = this.level.tiles[move.column2][move.row2];
        this.level.tiles[move.column1][move.row1] = tile2;
        this.level.tiles[move.column2][move.row2] = tile1;
    }

    private findClusters(level: Level): Cluster[] {
        const clusters: Cluster[] = [];

        // Find horizontal clusters
        for (let j = 0; j < level.rows; j++) {
            let matchLength = 1;
            for (let i = 0; i < level.columns; i++) {
                let checkMatch = false;

                if (i === level.columns - 1) {
                    checkMatch = true;
                } else {
                    if (level.tiles[i][j].type === level.tiles[i + 1][j].type &&
                        level.tiles[i][j].type !== -1) {
                        matchLength += 1;
                    } else {
                        checkMatch = true;
                    }
                }

                if (checkMatch) {
                    if (matchLength >= 3) {
                        clusters.push({
                            column: i + 1 - matchLength,
                            row: j,
                            length: matchLength,
                            horizontal: true
                        });
                    }
                    matchLength = 1;
                }
            }
        }

        // Find vertical clusters
        for (let i = 0; i < level.columns; i++) {
            let matchLength = 1;
            for (let j = 0; j < level.rows; j++) {
                let checkMatch = false;

                if (j === level.rows - 1) {
                    checkMatch = true;
                } else {
                    if (level.tiles[i][j].type === level.tiles[i][j + 1].type &&
                        level.tiles[i][j].type !== -1) {
                        matchLength += 1;
                    } else {
                        checkMatch = true;
                    }
                }

                if (checkMatch) {
                    if (matchLength >= 3) {
                        clusters.push({
                            column: i,
                            row: j + 1 - matchLength,
                            length: matchLength,
                            horizontal: false
                        });
                    }
                    matchLength = 1;
                }
            }
        }

        return clusters;
    }

    private findMoves(): void {
        this.moves = [];
        
        // Check horizontal swaps
        for (let j = 0; j < this.level.rows; j++) {
            for (let i = 0; i < this.level.columns - 1; i++) {
                this.swapTiles({
                    column1: i,
                    row1: j,
                    column2: i + 1,
                    row2: j
                });
                
                if (this.findClusters(this.level).length > 0) {
                    this.moves.push({
                        column1: i,
                        row1: j,
                        column2: i + 1,
                        row2: j
                    });
                }
                
                this.swapTiles({
                    column1: i,
                    row1: j,
                    column2: i + 1,
                    row2: j
                });
            }
        }
        
        // Check vertical swaps
        for (let i = 0; i < this.level.columns; i++) {
            for (let j = 0; j < this.level.rows - 1; j++) {
                this.swapTiles({
                    column1: i,
                    row1: j,
                    column2: i,
                    row2: j + 1
                });
                
                if (this.findClusters(this.level).length > 0) {
                    this.moves.push({
                        column1: i,
                        row1: j,
                        column2: i,
                        row2: j + 1
                    });
                }
                
                this.swapTiles({
                    column1: i,
                    row1: j,
                    column2: i,
                    row2: j + 1
                });
            }
        }
    }

    private removeClusters(): void {
        for (const cluster of this.clusters) {
            const range = new Array(cluster.length).fill(0).map((_, i) => i);
            
            for (const i of range) {
                const column = cluster.horizontal ? cluster.column + i : cluster.column;
                const row = cluster.horizontal ? cluster.row : cluster.row + i;
                this.level.tiles[column][row].type = -1;
            }
        }
    }

    private shiftTiles(): void {
        for (let i = 0; i < this.level.columns; i++) {
            let shift = 0;
            for (let j = this.level.rows - 1; j >= 0; j--) {
                if (this.level.tiles[i][j].type === -1) {
                    shift++;
                    this.level.tiles[i][j].shift = 0;
                } else {
                    this.level.tiles[i][j].shift = shift;
                }
            }
        }
    }

    private fillEmptyTiles(): void {
        for (let i = 0; i < this.level.columns; i++) {
            for (let j = this.level.rows - 1; j >= 0; j--) {
                if (this.level.tiles[i][j].type === -1) {
                    this.level.tiles[i][j].type = Math.floor(Math.random() * GAME_CONFIG.TILE_COLORS.length);
                }
            }
        }
    }

    private newGame(): void {
        this.level = this.initializeLevel();
        this.score = 0;
        this.gameState = GAME_STATES.ready;
        this.gameOver = false;
        this.moves = [];
        this.clusters = [];
    }
}
