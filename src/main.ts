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
        console.log('Document ready state:', document.readyState);
        
        // Get the canvas element
        const canvas = document.querySelector<HTMLCanvasElement>('#gameCanvas');
        console.log('Canvas element:', canvas);

        if (!canvas) {
            console.error('Could not find canvas element with id "gameCanvas"');
            return;
        }

        // Initialize the game
        this.game = new Game(canvas);
        
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
