import {SayHelloWorld} from "./sayHelloWorld.ts";
import {Cluster, ClusterFunction, Level, Move, Position, Tile} from "./types.ts";

// ------------------------------------------------------------------------
// How To Make A Match-3 Game With HTML5 Canvas
// Copyright (c) 2015 Rembound.com
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see http://www.gnu.org/licenses/.
//
// http://rembound.com/articles/how-to-make-a-match3-game-with-html5-canvas
// ------------------------------------------------------------------------

// The function gets called when the window is fully loaded
window.onload = function() {
    const currentDate = new Date();
    SayHelloWorld(currentDate);
    // Get the canvas and context
    const canvas = document.getElementById("viewport") as HTMLCanvasElement;
    let context = canvas.getContext("2d");

    // Timing and frames per second
    let lastFrame = 0;
    let fpsTime = 0;
    let frameCount = 0;
    let fps = 0;

    // Mouse dragging
    let drag = false;

    // Level object
    let level: Level = {
        x: 250,         // X position
        y: 113,         // Y position
        columns: 8,     // Number of tile columns
        rows: 8,        // Number of tile rows
        tileWidth: 40,  // Visual width of a tile
        tileHeight: 40, // Visual height of a tile
        tiles: [] as Tile[][],      // The two-dimensional tile array
        selectedTile: { selected: false, column: 0, row: 0 } as Tile,
    };

    // All the different tile colors in RGB
    let tileColors = [[255, 128, 128],
        [128, 255, 128],
        [128, 128, 255],
        [255, 255, 128],
        [255, 128, 255],
        [128, 255, 255],
        [255, 255, 255]];

    // Clusters and moves that were found
    let clusters: Cluster[] = [];  // { column, row, length, horizontal }
    let moves: Move[] = [];     // { column1, row1, column2, row2 }

    // Current move
    let currentMove = { column1: 0, row1: 0, column2: 0, row2: 0 };

    // Game states
    let gameStates = { init: 0, ready: 1, resolve: 2 };
    let gameState = gameStates.init;

    // Score
    let score = 0;

    // Animation variables
    let animationState = 0;
    let animationTime = 0;
    let animationTimeTotal = 0.3;

    // Show available moves
    let showMoves = false;

    // The AI bot
    let aiBot = false;

    // Game Over
    let gameOver = false;

    // Gui buttons
    let buttons = [ { x: 30, y: 240, width: 150, height: 50, text: "New Game"},
        { x: 30, y: 300, width: 150, height: 50, text: "Show Moves"},
        { x: 30, y: 360, width: 150, height: 50, text: "Enable AI Bot"}];

    // Initialize the game
    function init() {
        // Add mouse events
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("mouseout", onMouseOut);

        // Initialize the two-dimensional tile array
        for (let i=0; i<level.columns; i++) {
            level.tiles[i] = [];
            for (let j=0; j<level.rows; j++) {
                // Define a tile type and a shift parameter for animation
                level.tiles[i][j] = {column: 0, row: 0, type: 0, shift: 0 }
                console.info({ level });
            }
        }

        // New game
        newGame();

        // Enter main loop
        main(0);
    }

    // Main loop
    function main(tframe: number) {
        // Request animation frames
        window.requestAnimationFrame(main);

        // Update and render the game
        update(tframe);
        render();
    }

    // Update the game state
    function update(tframe: number) {
        let dt = (tframe - lastFrame) / 1000;
        lastFrame = tframe;

        // Update the fps counter
        updateFps(dt);

        if (gameState === gameStates.ready) {
            // Game is ready for player input

            // Check for game over
            if (moves.length <= 0) {
                gameOver = true;
            }

            // Let the AI bot make a move, if enabled
            if (aiBot) {
                animationTime += dt;
                if (animationTime > animationTimeTotal) {
                    // Check if there are moves available
                    findMoves();

                    if (moves.length > 0) {
                        // Get a random valid move
                        let move = moves[Math.floor(Math.random() * moves.length)];

                        // Simulate a player using the mouse to swap two tiles
                        mouseSwap(move.column1, move.row1, move.column2, move.row2);
                    } else {
                        // No moves left, Game Over. We could start a new game.
                        // newGame();
                    }
                    animationTime = 0;
                }
            }
        } else if (gameState === gameStates.resolve) {
            // Game is busy resolving and animating clusters
            animationTime += dt;

            if (animationState === 0) {
                // Clusters need to be found and removed
                if (animationTime > animationTimeTotal) {
                    // Find clusters
                    findClusters();

                    if (clusters.length > 0) {
                        // Add points to the score
                        for (let i=0; i<clusters.length; i++) {
                            // Add extra points for longer clusters
                            score += 100 * (clusters[i].length - 2);
                        }

                        // Clusters found, remove them
                        removeClusters();

                        // Tiles need to be shifted
                        animationState = 1;
                    } else {
                        // No clusters found, animation complete
                        gameState = gameStates.ready;
                    }
                    animationTime = 0;
                }
            } else if (animationState === 1) {
                // Tiles need to be shifted
                if (animationTime > animationTimeTotal) {
                    // Shift tiles
                    shiftTiles();

                    // New clusters need to be found
                    animationState = 0;
                    animationTime = 0;

                    // Check if there are new clusters
                    findClusters();
                    if (clusters.length <= 0) {
                        // Animation complete
                        gameState = gameStates.ready;
                    }
                }
            } else if (animationState === 2) {
                // Swapping tiles animation
                if (animationTime > animationTimeTotal) {
                    // Swap the tiles
                    swap(currentMove.column1, currentMove.row1, currentMove.column2, currentMove.row2);

                    // Check if the swap made a cluster
                    findClusters();
                    if (clusters.length > 0) {
                        // Valid swap, found one or more clusters
                        // Prepare animation states
                        animationState = 0;
                        animationTime = 0;
                        gameState = gameStates.resolve;
                    } else {
                        // Invalid swap, Rewind swapping animation
                        animationState = 3;
                        animationTime = 0;
                    }

                    // Update moves and clusters
                    findMoves();
                    findClusters();
                }
            } else if (animationState === 3) {
                // Rewind swapping animation
                if (animationTime > animationTimeTotal) {
                    // Invalid swap, swap back
                    swap(currentMove.column1, currentMove.row1, currentMove.column2, currentMove.row2);

                    // Animation complete
                    gameState = gameStates.ready;
                }
            }

            // Update moves and clusters
            findMoves();
            findClusters();
        }
    }

    function updateFps(dt: number) {
        if (fpsTime > 0.25) {
            // Calculate fps
            fps = Math.round(frameCount / fpsTime);

            // Reset time and frameCount
            fpsTime = 0;
            frameCount = 0;
        }

        // Increase time and frameCount
        fpsTime += dt;
        frameCount++;
    }

    // Draw text that is centered
    function drawCenterText(text: string, x: number, y: number, width: number) {
        if (context === null || context === undefined) {
            return;
        }
        let textdim = context.measureText(text);
        context.fillText(text, x + (width-textdim.width)/2, y);
    }

    // Render the game
    function render() {
        // Draw the frame
        drawFrame();

        // Draw score
        if (context === null || context === undefined) {
            return;
        }
        context.fillStyle = "#000000";
        context.font = "24px Verdana";
        drawCenterText("Score:", 30, level.y+40, 150);
        drawCenterText(score.toString(), 30, level.y+70, 150);

        // Draw buttons
        drawButtons();

        // Draw level background
        let levelWidth = level.columns * level.tileWidth;
        let levelHeight = level.rows * level.tileHeight;
        context.fillStyle = "#000000";
        context.fillRect(level.x - 4, level.y - 4, levelWidth + 8, levelHeight + 8);

        // Render tiles
        renderTiles();

        // Render clusters
        renderClusters();

        // Render moves, when there are no clusters
        if (showMoves && clusters.length <= 0 && gameState === gameStates.ready) {
            renderMoves();
        }

        // Game Over overlay
        if (gameOver) {
            context.fillStyle = "rgba(0, 0, 0, 0.8)";
            context.fillRect(level.x, level.y, levelWidth, levelHeight);

            context.fillStyle = "#ffffff";
            context.font = "24px Verdana";
            drawCenterText("Game Over!", level.x, level.y + levelHeight / 2 + 10, levelWidth);
        }
    }

    // Draw a frame with a border
    function drawFrame() {
        // Draw background and a border
        if (context === null || context === undefined) {
            return;
        }
        context.fillStyle = "#d0d0d0";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#e8eaec";
        context.fillRect(1, 1, canvas.width-2, canvas.height-2);

        // Draw header
        context.fillStyle = "#303030";
        context.fillRect(0, 0, canvas.width, 65);

        // Draw title
        context.fillStyle = "#ffffff";
        context.font = "24px Verdana";
        context.fillText("Match3 Example - Rembound.com", 10, 30);

        // Display fps
        context.fillStyle = "#ffffff";
        context.font = "12px Verdana";
        context.fillText("Fps: " + fps, 13, 50);
    }

    // Draw buttons
    function drawButtons() {
        for (let i=0; i<buttons.length; i++) {
            // Draw button shape
            if (context === null || context === undefined) {
                return;
            }
            context.fillStyle = "#000000";
            context.fillRect(buttons[i].x, buttons[i].y, buttons[i].width, buttons[i].height);

            // Draw button text
            context.fillStyle = "#ffffff";
            context.font = "18px Verdana";
            let textDim = context.measureText(buttons[i].text);
            context.fillText(buttons[i].text, buttons[i].x + (buttons[i].width-textDim.width)/2, buttons[i].y+30);
        }
    }

    // Render tiles
    function renderTiles() {
        for (let i=0; i<level.columns; i++) {
            for (let j=0; j<level.rows; j++) {
                // Get the shift of the tile for animation
                let shift = level.tiles[i][j].shift;

                // Calculate the tile coordinates
                let coordinates = getTileCoordinate(i, j, 0, (animationTime / animationTimeTotal) * shift);

                // Check if there is a tile present
                if (level.tiles[i][j].type >= 0) {
                    // Get the color of the tile
                    let col = tileColors[level.tiles[i][j].type];

                    // Draw the tile using the color
                    drawTile(coordinates.tileX, coordinates.tileY, col[0], col[1], col[2]);
                }

                // Draw the selected tile
                if (level.selectedTile.selected) {
                    if (level.selectedTile.column === i && level.selectedTile.row === j) {
                        // Draw a red tile
                        drawTile(coordinates.tileX, coordinates.tileY, 255, 0, 0);
                    }
                }
            }
        }

        // Render the swap animation
        if (gameState === gameStates.resolve && (animationState === 2 || animationState === 3)) {
            // Calculate the x and y shift
            let shiftX = currentMove.column2 - currentMove.column1;
            let shiftY = currentMove.row2 - currentMove.row1;

            // First tile
            let coordinates1 = getTileCoordinate(currentMove.column1, currentMove.row1, 0, 0);
            let coordinates1Shift = getTileCoordinate(currentMove.column1, currentMove.row1, (animationTime / animationTimeTotal) * shiftX, (animationTime / animationTimeTotal) * shiftY);
            let col1 = tileColors[level.tiles[currentMove.column1][currentMove.row1].type];

            // Second tile
            let coordinates2 = getTileCoordinate(currentMove.column2, currentMove.row2, 0, 0);
            let coordinates2Shift = getTileCoordinate(currentMove.column2, currentMove.row2, (animationTime / animationTimeTotal) * -shiftX, (animationTime / animationTimeTotal) * -shiftY);
            let col2 = tileColors[level.tiles[currentMove.column2][currentMove.row2].type];

            // Draw a black background
            drawTile(coordinates1.tileX, coordinates1.tileY, 0, 0, 0);
            drawTile(coordinates2.tileX, coordinates2.tileY, 0, 0, 0);

            // Change the order, depending on the animation state
            if (animationState === 2) {
                // Draw the tiles
                drawTile(coordinates1Shift.tileX, coordinates1Shift.tileY, col1[0], col1[1], col1[2]);
                drawTile(coordinates2Shift.tileX, coordinates2Shift.tileY, col2[0], col2[1], col2[2]);
            } else {
                // Draw the tiles
                drawTile(coordinates2Shift.tileX, coordinates2Shift.tileY, col2[0], col2[1], col2[2]);
                drawTile(coordinates1Shift.tileX, coordinates1Shift.tileY, col1[0], col1[1], col1[2]);
            }
        }
    }

    // Get the tile coordinate
    function getTileCoordinate(column: number, row: number, columnOffset: number, rowOffset: number) {
        let tileX = level.x + (column + columnOffset) * level.tileWidth;
        let tileY = level.y + (row + rowOffset) * level.tileHeight;
        return { tileX: tileX, tileY: tileY};
    }

    // Draw a tile with a color
    function drawTile(x: number, y: number, r: number, g: number, b: number) {
        if (context === null || context === undefined) {
            return;
        }
        context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        context.fillRect(x + 2, y + 2, level.tileWidth - 4, level.tileHeight - 4);
    }

    // Render clusters
    function renderClusters() {
        for (let i=0; i<clusters.length; i++) {
            // Calculate the tile coordinates
            let tileCoordinates = getTileCoordinate(clusters[i].column, clusters[i].row, 0, 0);
            if (context === null || context === undefined) {
                return;
            }
            if (clusters[i].horizontal) {
                // Draw a horizontal line
                context.fillStyle = "#00ff00";
                context.fillRect(tileCoordinates.tileX + level.tileWidth/2, tileCoordinates.tileY + level.tileHeight/2 - 4, (clusters[i].length - 1) * level.tileWidth, 8);
            } else {
                // Draw a vertical line
                context.fillStyle = "#0000ff";
                context.fillRect(tileCoordinates.tileX + level.tileWidth/2 - 4, tileCoordinates.tileY + level.tileHeight/2, 8, (clusters[i].length - 1) * level.tileHeight);
            }
        }
    }

    // Render moves
    function renderMoves() {
        for (let i=0; i<moves.length; i++) {
            // Calculate coordinates of tile 1 and 2
            let coord1 = getTileCoordinate(moves[i].column1, moves[i].row1, 0, 0);
            let coord2 = getTileCoordinate(moves[i].column2, moves[i].row2, 0, 0);

            // Draw a line from tile 1 to tile 2
            if (context === null || context === undefined) {
                return;
            }
            context.strokeStyle = "#ff0000";
            context.beginPath();
            context.moveTo(coord1.tileX + level.tileWidth/2, coord1.tileY + level.tileHeight/2);
            context.lineTo(coord2.tileX + level.tileWidth/2, coord2.tileY + level.tileHeight/2);
            context.stroke();
        }
    }

    // Start a new game
    function newGame() {
        // Reset score
        score = 0;

        // Set the gameState to ready
        gameState = gameStates.ready;

        // Reset game over
        gameOver = false;

        // Create the level
        createLevel();

        // Find initial clusters and moves
        findMoves();
        findClusters();
    }

    // Create a random level
    function createLevel() {
        let done = false;

        // Keep generating levels until it is correct
        while (!done) {

            // Create a level with random tiles
            for (let i=0; i<level.columns; i++) {
                for (let j=0; j<level.rows; j++) {
                    level.tiles[i][j].type = getRandomTile();
                }
            }

            // Resolve the clusters
            resolveClusters();

            // Check if there are valid moves
            findMoves();

            // Done when there is a valid move
            if (moves.length > 0) {
                done = true;
            }
        }
    }

    // Get a random tile
    function getRandomTile() {
        return Math.floor(Math.random() * tileColors.length);
    }

    // Remove clusters and insert tiles
    function resolveClusters() {
        // Check for clusters
        findClusters();

        // While there are clusters left
        while (clusters.length > 0) {

            // Remove clusters
            removeClusters();

            // Shift tiles
            shiftTiles();

            // Check if there are clusters left
            findClusters();
        }
    }

    // Find clusters in the level
    function findClusters() {
        // Reset clusters
        clusters = []

        // Find horizontal clusters
        for (let j=0; j<level.rows; j++) {
            // Start with a single tile, cluster of 1
            let matchlength = 1;
            for (let i=0; i<level.columns; i++) {
                let checkcluster = false;

                if (i === level.columns-1) {
                    // Last tile
                    checkcluster = true;
                } else {
                    // Check the type of the next tile
                    if (level.tiles[i][j].type === level.tiles[i+1][j].type &&
                        level.tiles[i][j].type !== -1) {
                        // Same type as the previous tile, increase matchlength
                        matchlength += 1;
                    } else {
                        // Different type
                        checkcluster = true;
                    }
                }

                // Check if there was a cluster
                if (checkcluster) {
                    if (matchlength >= 3) {
                        // Found a horizontal cluster
                        clusters.push({ column: i+1-matchlength, row:j,
                            length: matchlength, horizontal: true });
                    }

                    matchlength = 1;
                }
            }
        }

        // Find vertical clusters
        for (let i=0; i<level.columns; i++) {
            // Start with a single tile, cluster of 1
            let matchlength = 1;
            for (let j=0; j<level.rows; j++) {
                let checkcluster = false;

                if (j === level.rows-1) {
                    // Last tile
                    checkcluster = true;
                } else {
                    // Check the type of the next tile
                    if (level.tiles[i][j].type === level.tiles[i][j+1].type &&
                        level.tiles[i][j].type !== -1) {
                        // Same type as the previous tile, increase matchlength
                        matchlength += 1;
                    } else {
                        // Different type
                        checkcluster = true;
                    }
                }

                // Check if there was a cluster
                if (checkcluster) {
                    if (matchlength >= 3) {
                        // Found a vertical cluster
                        clusters.push({ column: i, row:j+1-matchlength,
                            length: matchlength, horizontal: false });
                    }

                    matchlength = 1;
                }
            }
        }
    }

    // Find available moves
    function findMoves() {
        // Reset moves
        moves = []

        // Check horizontal swaps
        for (let j=0; j<level.rows; j++) {
            for (let i=0; i<level.columns-1; i++) {
                // Swap, find clusters and swap back
                swap(i, j, i+1, j);
                findClusters();
                swap(i, j, i+1, j);

                // Check if the swap made a cluster
                if (clusters.length > 0) {
                    // Found a move
                    moves.push({column1: i, row1: j, column2: i+1, row2: j});
                }
            }
        }

        // Check vertical swaps
        for (let i=0; i<level.columns; i++) {
            for (let j=0; j<level.rows-1; j++) {
                // Swap, find clusters and swap back
                swap(i, j, i, j+1);
                findClusters();
                swap(i, j, i, j+1);

                // Check if the swap made a cluster
                if (clusters.length > 0) {
                    // Found a move
                    moves.push({column1: i, row1: j, column2: i, row2: j+1});
                }
            }
        }

        // Reset clusters
        clusters = []
    }

    // Loop over the cluster tiles and execute a function
    function loopClusters(func: ClusterFunction) {
        for (let i=0; i<clusters.length; i++) {
            //  { column, row, length, horizontal }
            let cluster = clusters[i];
            let coffset = 0;
            let roffset = 0;
            for (let j=0; j<cluster.length; j++) {
                func(i, cluster.column+coffset, cluster.row+roffset, cluster);

                if (cluster.horizontal) {
                    coffset++;
                } else {
                    roffset++;
                }
            }
        }
    }

    // Remove the clusters
    function removeClusters() {
        // Change the type of the tiles to -1, indicating a removed tile
        loopClusters(function(index, column, row, cluster) {
            console.info("hello, cluster");
            console.info({ cluster });
            console.info({ index });
            level.tiles[column][row].type = -1;
        });

        // Calculate how much a tile should be shifted downwards
        for (let i=0; i<level.columns; i++) {
            let shift = 0;
            for (let j=level.rows-1; j>=0; j--) {
                // Loop from bottom to top
                if (level.tiles[i][j].type === -1) {
                    // Tile is removed, increase shift
                    shift++;
                    level.tiles[i][j].shift = 0;
                } else {
                    // Set the shift
                    level.tiles[i][j].shift = shift;
                }
            }
        }
    }

    // Shift tiles and insert new tiles
    function shiftTiles() {
        // Shift tiles
        for (let i=0; i<level.columns; i++) {
            for (let j=level.rows-1; j>=0; j--) {
                // Loop from bottom to top
                if (level.tiles[i][j].type === -1) {
                    // Insert new random tile
                    level.tiles[i][j].type = getRandomTile();
                } else {
                    // Swap tile to shift it
                    let shift = level.tiles[i][j].shift;
                    if (shift > 0) {
                        swap(i, j, i, j+shift)
                    }
                }

                // Reset shift
                level.tiles[i][j].shift = 0;
            }
        }
    }

    // Get the tile under the mouse
    function getMouseTile(pos: Position) {
        // Calculate the index of the tile
        let tX = Math.floor((pos.x - level.x) / level.tileWidth);
        let tY = Math.floor((pos.y - level.y) / level.tileHeight);

        // Check if the tile is valid
        if (tX >= 0 && tX < level.columns && tY >= 0 && tY < level.rows) {
            // Tile is valid
            return {
                valid: true,
                x: tX,
                y: tY
            };
        }

        // No valid tile
        return {
            valid: false,
            x: 0,
            y: 0
        };
    }

    // Check if two tiles can be swapped
    function canSwap(x1: number, y1: number, x2: number, y2: number) {
        // Check if the tile is a direct neighbor of the selected tile
        return (Math.abs(x1 - x2) === 1 && y1 === y2) ||
            (Math.abs(y1 - y2) === 1 && x1 === x2);


    }

    // Swap two tiles in the level
    function swap(x1: number, y1: number, x2: number, y2: number) {
        let typeswap = level.tiles[x1][y1].type;
        level.tiles[x1][y1].type = level.tiles[x2][y2].type;
        level.tiles[x2][y2].type = typeswap;
    }

    // Swap two tiles as a player action
    function mouseSwap(c1: number, r1: number, c2: number, r2: number) {
        // Save the current move
        currentMove = {column1: c1, row1: r1, column2: c2, row2: r2};

        // Deselect
        level.selectedTile.selected = false;

        // Start animation
        animationState = 2;
        animationTime = 0;
        gameState = gameStates.resolve;
    }

    // On mouse movement
    function onMouseMove(e: MouseEvent) {
        // Get the mouse position
        let pos: Position = getMousePos(canvas, e);

        // Check if we are dragging with a tile selected
        if (drag && level.selectedTile.selected) {
            // Get the tile under the mouse
            let mt = getMouseTile(pos);
            if (mt.valid) {
                // Valid tile

                // Check if the tiles can be swapped
                if (canSwap(mt.x, mt.y, level.selectedTile.column, level.selectedTile.row)){
                    // Swap the tiles
                    mouseSwap(mt.x, mt.y, level.selectedTile.column, level.selectedTile.row);
                }
            }
        }
    }

    // On mouse button click
    function onMouseDown(e: MouseEvent) {
        // Get the mouse position
        let position = getMousePos(canvas, e);

        // Start dragging
        let mt: Position;
        if (!drag) {
            // Get the tile under the mouse
            mt = getMouseTile(position);

            if (mt.valid) {
                // Valid tile
                let swapped = false;
                if (level.selectedTile.selected) {
                    if (mt.x === level.selectedTile.column && mt.y === level.selectedTile.row) {
                        // Same tile selected, deselect
                        level.selectedTile.selected = false;
                        drag = true;
                        return;
                    } else if (canSwap(mt.x, mt.y, level.selectedTile.column, level.selectedTile.row)) {
                        // Tiles can be swapped, swap the tiles
                        mouseSwap(mt.x, mt.y, level.selectedTile.column, level.selectedTile.row);
                        swapped = true;
                    }
                }

                if (!swapped) {
                    // Set the new selected tile
                    level.selectedTile.column = mt.x;
                    level.selectedTile.row = mt.y;
                    level.selectedTile.selected = true;
                }
            } else {
                // Invalid tile
                level.selectedTile.selected = false;
            }

            // Start dragging
            drag = true;
        }

        // Check if a button was clicked
        for (let i=0; i<buttons.length; i++) {
            if (position.x >= buttons[i].x && position.x < buttons[i].x+buttons[i].width &&
                position.y >= buttons[i].y && position.y < buttons[i].y+buttons[i].height) {

                // Button i was clicked
                if (i === 0) {
                    // New Game
                    newGame();
                } else if (i === 1) {
                    // Show Moves
                    showMoves = !showMoves;
                    buttons[i].text = (showMoves?"Hide":"Show") + " Moves";
                } else if (i === 2) {
                    // AI Bot
                    aiBot = !aiBot;
                    buttons[i].text = (aiBot?"Disable":"Enable") + " AI Bot";
                }
            }
        }
    }

    function onMouseUp(e: MouseEvent) {
        // Reset dragging
        console.info(`onMouseUp()`)
        console.info({ e });
        drag = false;
    }

    function onMouseOut(e: MouseEvent) {
        // Reset dragging
        console.info(`onMouseOut()`);
        console.info({ e });
        drag = false;
    }

    // Get the mouse position
    function getMousePos(canvas: HTMLCanvasElement, e: MouseEvent) {
        let rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((e.clientX - rect.left)/(rect.right - rect.left)*canvas.width),
            y: Math.round((e.clientY - rect.top)/(rect.bottom - rect.top)*canvas.height)
        };
    }

    // Call init to start the game
    init();
};