import { Level, Cluster, Move, Button } from './types';
import { GAME_CONFIG } from './config';

export class GameRenderer {
    private context: CanvasRenderingContext2D;
    private fps: number;

    constructor(context: CanvasRenderingContext2D) {
        this.context = context;
        this.fps = 0;
    }

    public setFps(fps: number): void {
        this.fps = fps;
    }

    public drawFrame(canvas: HTMLCanvasElement): void {
        // Draw background and border
        this.context.fillStyle = "#d0d0d0";
        this.context.fillRect(0, 0, canvas.width, canvas.height);
        this.context.fillStyle = "#e8eaec";
        this.context.fillRect(1, 1, canvas.width - 2, canvas.height - 2);

        // Draw header
        this.context.fillStyle = "#303030";
        this.context.fillRect(0, 0, canvas.width, 65);

        // Draw title
        this.context.fillStyle = "#ffffff";
        this.context.font = "24px Verdana";
        this.context.fillText("Match3 Game", 10, 30);

        // Display fps
        this.context.fillStyle = "#ffffff";
        this.context.font = "12px Verdana";
        this.context.fillText(`Fps: ${this.fps}`, 13, 50);
    }

    public drawTile(x: number, y: number, r: number, g: number, b: number, level: Level): void {
        this.context.fillStyle = `rgb(${r},${g},${b})`;
        this.context.fillRect(
            x + 2, 
            y + 2, 
            level.tilewidth - 4, 
            level.tileheight - 4
        );
    }

    public drawLevel(level: Level, tileColors: number[][]): void {
        // Draw level background
        this.context.fillStyle = "#000000";
        this.context.fillRect(
            level.x - 4, 
            level.y - 4, 
            level.columns * level.tilewidth + 8, 
            level.rows * level.tileheight + 8
        );

        // Draw tiles
        for (let i = 0; i < level.columns; i++) {
            for (let j = 0; j < level.rows; j++) {
                // Get the shift of the tile for animation
                const shift = level.tiles[i][j].shift;
                
                // Calculate the tile position
                const tilex = level.x + i * level.tilewidth;
                const tiley = level.y + j * level.tileheight;
                
                // Get the tile color
                const tileColor = tileColors[level.tiles[i][j].type];
                
                // Draw the tile
                this.drawTile(
                    tilex, 
                    tiley + shift, 
                    tileColor[0], 
                    tileColor[1], 
                    tileColor[2], 
                    level
                );
            }
        }
    }

    public drawButtons(buttons: Button[]): void {
        for (const button of buttons) {
            // Draw button background
            this.context.fillStyle = "#000000";
            this.context.fillRect(
                button.x - 2, 
                button.y - 2, 
                button.width + 4, 
                button.height + 4
            );
            
            this.context.fillStyle = "#e8eaec";
            this.context.fillRect(
                button.x, 
                button.y, 
                button.width, 
                button.height
            );
            
            // Draw button text
            this.context.fillStyle = "#303030";
            this.context.font = "18px Verdana";
            const textDim = this.context.measureText(button.text);
            this.context.fillText(
                button.text, 
                button.x + (button.width - textDim.width) / 2, 
                button.y + 30
            );
        }
    }

    public drawMoves(moves: Move[], level: Level): void {
        // Draw moves
        for (const move of moves) {
            // Calculate coordinates of move circles
            const x1 = level.x + move.column1 * level.tilewidth + level.tilewidth / 2;
            const y1 = level.y + move.row1 * level.tileheight + level.tileheight / 2;
            const x2 = level.x + move.column2 * level.tilewidth + level.tilewidth / 2;
            const y2 = level.y + move.row2 * level.tileheight + level.tileheight / 2;
            
            // Draw a line between circles
            this.context.strokeStyle = "#ff0000";
            this.context.lineWidth = 2;
            this.context.beginPath();
            this.context.moveTo(x1, y1);
            this.context.lineTo(x2, y2);
            this.context.stroke();
            
            // Draw circles
            this.context.fillStyle = "#ff0000";
            this.context.beginPath();
            this.context.arc(x1, y1, 5, 0, 2 * Math.PI, false);
            this.context.fill();
            this.context.beginPath();
            this.context.arc(x2, y2, 5, 0, 2 * Math.PI, false);
            this.context.fill();
        }
    }

    public drawClusters(clusters: Cluster[], level: Level): void {
        for (const cluster of clusters) {
            // Calculate cluster dimensions
            const width = cluster.horizontal ? cluster.length * level.tilewidth : level.tilewidth;
            const height = cluster.horizontal ? level.tileheight : cluster.length * level.tileheight;
            
            // Draw cluster rectangle
            this.context.fillStyle = "rgba(255, 0, 0, 0.2)";
            this.context.fillRect(
                level.x + cluster.column * level.tilewidth, 
                level.y + cluster.row * level.tileheight, 
                width, 
                height
            );
        }
    }

    public drawScore(score: number): void {
        this.context.fillStyle = "#ffffff";
        this.context.font = "18px Verdana";
        this.context.fillText(`Score: ${score}`, canvas.width - 140, 30);
    }

    public drawGameOver(): void {
        this.context.fillStyle = "rgba(0, 0, 0, 0.8)";
        this.context.fillRect(0, 0, canvas.width, canvas.height);
        
        this.context.fillStyle = "#ffffff";
        this.context.font = "24px Verdana";
        const textDim = this.context.measureText("Game Over!");
        this.context.fillText(
            "Game Over!", 
            (canvas.width - textDim.width) / 2, 
            canvas.height / 2
        );
    }
}
