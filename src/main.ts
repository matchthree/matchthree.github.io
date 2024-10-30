import { Game } from './game';

class GameLoader {
    private game: Game | null = null;

    constructor() {
        console.log('GameLoader constructor called');
        if (document.readyState === 'loading') {
            console.log('Document still loading, waiting for DOMContentLoaded');
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            console.log('Document already loaded, initializing immediately');
            this.initialize();
        }
    }

    private initialize(): void {
        console.log('Initializing game...');
        
        // Get the canvas element
        const canvasElement = document.getElementById('gameCanvas');
        console.log('Canvas element:', canvasElement);

        if (!canvasElement || !(canvasElement instanceof HTMLCanvasElement)) {
            console.error('Could not find canvas element with id "gameCanvas"');
            return;
        }

        // Set canvas size
        canvasElement.width = 800;
        canvasElement.height = 600;

        // Initialize the game
        this.game = new Game(canvasElement);
        
        // Start the game loop
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    private gameLoop(timestamp: number): void {
        if (!this.game) return;

        // Update game state
        this.game.update(timestamp);
        
        // Draw the game
        this.game.render();

        // Continue the game loop
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
}

// Wait for the module to load before creating the game loader
console.log('Module loaded, creating GameLoader');
new GameLoader();
