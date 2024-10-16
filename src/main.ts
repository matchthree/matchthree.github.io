window.onload = function() {
    const canvas = document.getElementById("viewport") as HTMLCanvasElement;
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
  
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
  
      // Adjust level dimensions and tile size
      level.x = canvas.width * 0.05;
      level.y = canvas.height * 0.22;
      level.tilewidth = (canvas.width * 0.8) / level.columns;
      level.tileheight = (canvas.height * 0.65) / level.rows;
  
      // Adjust button positions
      buttons[0].x = canvas.width * 0.05;
      buttons[0].y = canvas.height * 0.06;
      buttons[1].x = canvas.width * 0.05;
      buttons[1].y = canvas.height * 0.11;
      buttons[2].x = canvas.width * 0.05;
      buttons[2].y = canvas.height * 0.16;
  
      // Adjust score position
      scoreX = canvas.width * 0.2;
      scoreY = canvas.height * 0.02;
    }
  
    window.addEventListener('resize', resizeCanvas);
  
    let lastframe = 0;
    let fpstime = 0;
    let framecount = 0;
    let fps = 0;
    let drag = false;

    const level: Level = {
        x: 250,
        y: 113,
        columns: 8,
        rows: 8,
        tilewidth: 40,
        tileheight: 40,
        tiles: [],
        selectedtile: { selected: false, column: 0, row: 0 }
    };

    const tilecolors: number[][] = [
        [255, 128, 128],
        [128, 255, 128],
        [128, 128, 255],
        [255, 255, 128],
        [255, 128, 255],
        [128, 255, 255],
        [255, 255, 255]
    ];

    let clusters: Cluster[] = [];
    let moves: Move[] = [];
    let currentmove: Move = { column1: 0, row1: 0, column2: 0, row2: 0 };

    const gamestates = { init: 0, ready: 1, resolve: 2 };
    let gamestate = gamestates.init;

    let score = 0;
    let animationstate = 0;
    let animationtime = 0;
    const animationtimetotal = 0.3;
    let showmoves = false;
    let aibot = false;
    let gameover = false;

    const buttons: Button[] = [
        { x: 30, y: 240, width: 150, height: 50, text: "New Game" },
        { x: 30, y: 300, width: 150, height: 50, text: "Show Moves" },
        { x: 30, y: 360, width: 150, height: 50, text: "Enable AI Bot" }
    ];

    function init() {
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("mouseout", onMouseOut);

        for (let i = 0; i < level.columns; i++) {
            level.tiles[i] = [];
            for (let j = 0; j < level.rows; j++) {
                level.tiles[i][j] = { type: 0, shift: 0 };
            }
        }

        newGame();
        main(0);
    }

    function main(tframe: number) {
        window.requestAnimationFrame(main);
        update(tframe);
        render();
    }

    function update(tframe: number) {
        const dt = (tframe - lastframe) / 1000;
        lastframe = tframe;
        updateFps(dt);
    
        if (gamestate === gamestates.ready) {
            if (moves.length <= 0) {
                gameover = true;
            }
    
            if (aibot) {
                animationtime += dt;
                if (animationtime > animationtimetotal) {
                    const optimalMove = findOptimalMove();
                    if (optimalMove) {
                        mouseSwap(optimalMove.column1, optimalMove.row1, optimalMove.column2, optimalMove.row2);
                    }
                    animationtime = 0;
                }
            }
        } else if (gamestate === gamestates.resolve) {
            animationtime += dt;
    
            if (animationstate === 0) {
                if (animationtime > animationtimetotal) {
                    findClusters();
                    if (clusters.length > 0) {
                        for (const cluster of clusters) {
                            score += 100 * (cluster.length - 2);
                        }
                        removeClusters();
                        animationstate = 1;
                    } else {
                        gamestate = gamestates.ready;
                    }
                    animationtime = 0;
                }
            } else if (animationstate === 1) {
                if (animationtime > animationtimetotal) {
                    shiftTiles();
                    animationstate = 0;
                    animationtime = 0;
                    findClusters();
                    if (clusters.length <= 0) {
                        gamestate = gamestates.ready;
                    }
                }
            } else if (animationstate === 2) {
                if (animationtime > animationtimetotal) {
                    swap(currentmove.column1, currentmove.row1, currentmove.column2, currentmove.row2);
                    findClusters();
                    if (clusters.length > 0) {
                        animationstate = 0;
                        animationtime = 0;
                        gamestate = gamestates.resolve;
                    } else {
                        animationstate = 3;
                        animationtime = 0;
                    }
                    findMoves();
                    findClusters();
                }
            } else if (animationstate === 3) {
                if (animationtime > animationtimetotal) {
                    swap(currentmove.column1, currentmove.row1, currentmove.column2, currentmove.row2);
                    gamestate = gamestates.ready;
                }
            }
    
            findMoves();
            findClusters();
        }
    }    

    function updateFps(dt: number) {
        if (fpstime > 0.25) {
            fps = Math.round(framecount / fpstime);
            fpstime = 0;
            framecount = 0;
        }
        fpstime += dt;
        framecount++;
    }

    function drawCenterText(text: string, x: number, y: number, width: number) {
        const textdim = context.measureText(text);
        context.fillText(text, x + (width - textdim.width) / 2, y);
    }

    function drawFrame() {
        // Draw background and a border
        context.fillStyle = "#d0d0d0";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#e8eaec";
        context.fillRect(1, 1, canvas.width - 2, canvas.height - 2);

        // Draw header
        context.fillStyle = "#303030";
        context.fillRect(0, 0, canvas.width, 65);

        // Draw title
        context.fillStyle = "#ffffff";
        context.font = "24px Verdana";
        context.fillText("match", 10, 30);

        // Display fps
        context.fillStyle = "#ffffff";
        context.font = "12px Verdana";
        context.fillText(`Fps: ${fps}`, 13, 50);
    }

    let scoreX = 30; // Initial score X position
    let scoreY = 40; // Initial score Y position
    
    function render() {
      drawFrame();
      context.fillStyle = "#000000";
      context.font = "24px Verdana";
      drawCenterText("Score:", scoreX, scoreY, 150);
      drawCenterText(score.toString(), scoreX, scoreY + 30, 150);
      drawButtons();
    
      const levelwidth = level.columns * level.tilewidth;
      const levelheight = level.rows * level.tileheight;
      context.fillStyle = "#000000";
      context.fillRect(level.x - 4, level.y - 4, levelwidth + 8, levelheight + 8);
    
      renderTiles();
      renderClusters();
    
      if (showmoves && clusters.length <= 0 && gamestate === gamestates.ready) {
          renderMoves();
      }
    
      if (gameover) {
          context.fillStyle = "rgba(0, 0, 0, 0.8)";
          context.fillRect(level.x, level.y, levelwidth, levelheight);
          context.fillStyle = "#ffffff";
          context.font = "24px Verdana";
          drawCenterText("Game Over!", level.x, level.y + levelheight / 2 + 10, levelwidth);
      }
    }
    
    function drawButtons() {
      for (const button of buttons) {
          context.fillStyle = "#000000";
          context.fillRect(button.x, button.y, button.width, button.height);
          context.fillStyle = "#ffffff";
          context.font = "18px Verdana";
          const textdim = context.measureText(button.text);
          context.fillText(button.text, button.x + (button.width - textdim.width) / 2, button.y + 30);
      }
    }

    function renderTiles() {
        for (let i = 0; i < level.columns; i++) {
            for (let j = 0; j < level.rows; j++) {
                const shift = level.tiles[i][j].shift;
                const coord = getTileCoordinate(i, j, 0, (animationtime / animationtimetotal) * shift);

                if (level.tiles[i][j].type >= 0) {
                    const col = tilecolors[level.tiles[i][j].type];
                    drawTile(coord.tilex, coord.tiley, col[0], col[1], col[2]);
                }

                if (level.selectedtile.selected) {
                    if (level.selectedtile.column === i && level.selectedtile.row === j) {
                        drawTile(coord.tilex, coord.tiley, 255, 0, 0);
                    }
                }
            }
        }

        if (gamestate === gamestates.resolve && (animationstate === 2 || animationstate === 3)) {
            const shiftx = currentmove.column2 - currentmove.column1;
            const shifty = currentmove.row2 - currentmove.row1;

            const coord1 = getTileCoordinate(currentmove.column1, currentmove.row1, 0, 0);
            const coord1shift = getTileCoordinate(currentmove.column1, currentmove.row1, (animationtime / animationtimetotal) * shiftx, (animationtime / animationtimetotal) * shifty);
            const col1 = tilecolors[level.tiles[currentmove.column1][currentmove.row1].type];

            const coord2 = getTileCoordinate(currentmove.column2, currentmove.row2, 0, 0);
            const coord2shift = getTileCoordinate(currentmove.column2, currentmove.row2, (animationtime / animationtimetotal) * -shiftx, (animationtime / animationtimetotal) * -shifty);
            const col2 = tilecolors[level.tiles[currentmove.column2][currentmove.row2].type];

            drawTile(coord1.tilex, coord1.tiley, 0, 0, 0);
            drawTile(coord2.tilex, coord2.tiley, 0, 0, 0);

            if (animationstate === 2) {
                drawTile(coord1shift.tilex, coord1shift.tiley, col1[0], col1[1], col1[2]);
                drawTile(coord2shift.tilex, coord2shift.tiley, col2[0], col2[1], col2[2]);
            } else {
                drawTile(coord2shift.tilex, coord2shift.tiley, col2[0], col2[1], col2[2]);
                drawTile(coord1shift.tilex, coord1shift.tiley, col1[0], col1[1], col1[2]);
            }
        }
    }

    function getTileCoordinate(column: number, row: number, columnoffset: number, rowoffset: number) {
        const tilex = level.x + (column + columnoffset) * level.tilewidth;
        const tiley = level.y + (row + rowoffset) * level.tileheight;
        return { tilex, tiley };
    }

    function drawTile(x: number, y: number, r: number, g: number, b: number) {
        context.fillStyle = `rgb(${r},${g},${b})`;
        context.fillRect(x + 2, y + 2, level.tilewidth - 4, level.tileheight - 4);
    }

    function renderClusters() {
        for (const cluster of clusters) {
            const coord = getTileCoordinate(cluster.column, cluster.row, 0, 0);

            if (cluster.horizontal) {
                context.fillStyle = "#00ff00";
                context.fillRect(coord.tilex + level.tilewidth / 2, coord.tiley + level.tileheight / 2 - 4, (cluster.length - 1) * level.tilewidth, 8);
            } else {
                context.fillStyle = "#0000ff";
                context.fillRect(coord.tilex + level.tilewidth / 2 - 4, coord.tiley + level.tileheight / 2, 8, (cluster.length - 1) * level.tileheight);
            }
        }
    }

    function renderMoves() {
        for (const move of moves) {
            const coord1 = getTileCoordinate(move.column1, move.row1, 0, 0);
            const coord2 = getTileCoordinate(move.column2, move.row2, 0, 0);

            context.strokeStyle = "#ff0000";
            context.beginPath();
            context.moveTo(coord1.tilex + level.tilewidth / 2, coord1.tiley + level.tileheight / 2);
            context.lineTo(coord2.tilex + level.tilewidth / 2, coord2.tiley + level.tileheight / 2);
            context.stroke();
        }
    }

    function newGame() {
        score = 0;
        gamestate = gamestates.ready;
        gameover = false;
        createLevel();
        findMoves();
        findClusters();
    }

    function createLevel() {
        let done = false;

        while (!done) {
            for (let i = 0; i < level.columns; i++) {
                for (let j = 0; j < level.rows; j++) {
                    level.tiles[i][j].type = getRandomTile();
                }
            }

            resolveClusters();
            findMoves();

            if (moves.length > 0) {
                done = true;
            }
        }
    }

    function getRandomTile() {
        return Math.floor(Math.random() * tilecolors.length);
    }

    function resolveClusters() {
        findClusters();

        while (clusters.length > 0) {
            removeClusters();
            shiftTiles();
            findClusters();
        }
    }

    function evaluateBoard() {
        let score = 0;
        const clusters = findClusters();
    
        for (const cluster of clusters) {
            score += (cluster.length - 2) * 100; // Example scoring: 100 points per tile in the cluster beyond the first two
        }
    
        return score;
    }
    
    function findClusters() {
        const clusters: Cluster[] = [];
    
        // Horizontal clusters
        for (let j = 0; j < level.rows; j++) {
            let matchLength = 1;
            for (let i = 0; i < level.columns; i++) {
                let checkCluster = false;
    
                if (i === level.columns - 1) {
                    checkCluster = true;
                } else {
                    if (level.tiles[i][j].type === level.tiles[i + 1][j].type && level.tiles[i][j].type !== -1) {
                        matchLength++;
                    } else {
                        checkCluster = true;
                    }
                }
    
                if (checkCluster) {
                    if (matchLength >= 3) {
                        clusters.push({ column: i + 1 - matchLength, row: j, length: matchLength, horizontal: true });
                    }
                    matchLength = 1;
                }
            }
        }
    
        // Vertical clusters
        for (let i = 0; i < level.columns; i++) {
            let matchLength = 1;
            for (let j = 0; j < level.rows; j++) {
                let checkCluster = false;
    
                if (j === level.rows - 1) {
                    checkCluster = true;
                } else {
                    if (level.tiles[i][j].type === level.tiles[i][j + 1].type && level.tiles[i][j].type !== -1) {
                        matchLength++;
                    } else {
                        checkCluster = true;
                    }
                }
    
                if (checkCluster) {
                    if (matchLength >= 3) {
                        clusters.push({ column: i, row: j + 1 - matchLength, length: matchLength, horizontal: false });
                    }
                    matchLength = 1;
                }
            }
        }
    
        return clusters;
    }    

    function findMoves() {
        moves = [];

        for (let j = 0; j < level.rows; j++) {
            for (let i = 0; i < level.columns - 1; i++) {
                swap(i, j, i + 1, j);
                findClusters();
                swap(i, j, i + 1, j);

                if (clusters.length > 0) {
                    moves.push({ column1: i, row1: j, column2: i + 1, row2: j });
                }
            }
        }

        for (let i = 0; i < level.columns; i++) {
            for (let j = 0; j < level.rows - 1; j++) {
                swap(i, j, i, j + 1);
                findClusters();
                swap(i, j, i, j + 1);

                if (clusters.length > 0) {
                    moves.push({ column1: i, row1: j, column2: i, row2: j + 1 });
                }
            }
        }

        clusters = [];
    }

    function loopClusters(func: (index: number, column: number, row: number, cluster: Cluster) => void) {
        for (let i = 0; i < clusters.length; i++) {
            const cluster = clusters[i];
            let coffset = 0;
            let roffset = 0;
            for (let j = 0; j < cluster.length; j++) {
                func(i, cluster.column + coffset, cluster.row + roffset, cluster);

                if (cluster.horizontal) {
                    coffset++;
                } else {
                    roffset++;
                }
            }
        }
    }

    function removeClusters() {
        loopClusters((index, column, row, cluster) => {
            console.info(index);
            console.info(cluster);
            level.tiles[column][row].type = -1;
        });

        for (let i = 0; i < level.columns; i++) {
            let shift = 0;
            for (let j = level.rows - 1; j >= 0; j--) {
                if (level.tiles[i][j].type === -1) {
                    shift++;
                    level.tiles[i][j].shift = 0;
                } else {
                    level.tiles[i][j].shift = shift;
                }
            }
        }
    }

    function shiftTiles() {
        for (let i = 0; i < level.columns; i++) {
            for (let j = level.rows - 1; j >= 0; j--) {
                if (level.tiles[i][j].type === -1) {
                    level.tiles[i][j].type = getRandomTile();
                } else {
                    const shift = level.tiles[i][j].shift;
                    if (shift > 0) {
                        swap(i, j, i, j + shift);
                    }
                }
                level.tiles[i][j].shift = 0;
            }
        }
    }

    function getMouseTile(pos: { x: number; y: number }) {
        const tx = Math.floor((pos.x - level.x) / level.tilewidth);
        const ty = Math.floor((pos.y - level.y) / level.tileheight);

        if (tx >= 0 && tx < level.columns && ty >= 0 && ty < level.rows) {
            return { valid: true, x: tx, y: ty };
        }

        return { valid: false, x: 0, y: 0 };
    }

    function canSwap(x1: number, y1: number, x2: number, y2: number) {
        return (Math.abs(x1 - x2) === 1 && y1 === y2) || (Math.abs(y1 - y2) === 1 && x1 === x2);
    }

    function swap(x1: number, y1: number, x2: number, y2: number) {
        const typeswap = level.tiles[x1][y1].type;
        level.tiles[x1][y1].type = level.tiles[x2][y2].type;
        level.tiles[x2][y2].type = typeswap;
    }

    function mouseSwap(c1: number, r1: number, c2: number, r2: number) {
        currentmove = { column1: c1, row1: r1, column2: c2, row2: r2 };
        level.selectedtile.selected = false;
        animationstate = 2;
        animationtime = 0;
        gamestate = gamestates.resolve;
    }

    function onMouseMove(e: MouseEvent) {
        const pos = getMousePos(canvas, e);

        if (drag && level.selectedtile.selected) {
            const mt = getMouseTile(pos);
            if (mt.valid) {
                if (canSwap(mt.x, mt.y, level.selectedtile.column, level.selectedtile.row)) {
                    mouseSwap(mt.x, mt.y, level.selectedtile.column, level.selectedtile.row);
                }
            }
        }
    }

    function onMouseDown(e: MouseEvent) {
        const pos = getMousePos(canvas, e);

        if (!drag) {
            const mt = getMouseTile(pos);

            if (mt.valid) {
                let swapped = false;
                if (level.selectedtile.selected) {
                    if (mt.x === level.selectedtile.column && mt.y === level.selectedtile.row) {
                        level.selectedtile.selected = false;
                        drag = true;
                        return;
                    } else if (canSwap(mt.x, mt.y, level.selectedtile.column, level.selectedtile.row)) {
                        mouseSwap(mt.x, mt.y, level.selectedtile.column, level.selectedtile.row);
                        swapped = true;
                    }
                }

                if (!swapped) {
                    level.selectedtile.column = mt.x;
                    level.selectedtile.row = mt.y;
                    level.selectedtile.selected = true;
                }
            } else {
                level.selectedtile.selected = false;
            }

            drag = true;
        }

        for (const button of buttons) {
            if (pos.x >= button.x && pos.x < button.x + button.width && pos.y >= button.y && pos.y < button.y + button.height) {
                if (button.text === "New Game") {
                    newGame();
                } else if (button.text.includes("Show Moves") || button.text.includes("Hide Moves")) {
                    showmoves = !showmoves;
                    button.text = (showmoves ? "Hide" : "Show") + " Moves";
                } else if (button.text.includes("Enable AI Bot") || button.text.includes("Disable AI Bot")) {
                    aibot = !aibot;
                    button.text = (aibot ? "Disable" : "Enable") + " AI Bot";
                }
            }
        }
    }

    function onMouseUp(e: MouseEvent) {
        console.info(e);
        drag = false;
    }

    function onMouseOut(e: MouseEvent) {
        console.info(e);
        drag = false;
    }

    function getMousePos(canvas: HTMLCanvasElement, e: MouseEvent) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((e.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
            y: Math.round((e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
        };
    }

    init();
    resizeCanvas(); // Initial resize     

    function findOptimalMove() {
        let bestMove: Move | null = null;
        let bestScore = -Infinity;
    
        for (let j = 0; j < level.rows; j++) {
            for (let i = 0; i < level.columns - 1; i++) {
                // Swap tiles
                swap(i, j, i + 1, j);
                // Evaluate the board
                const score = evaluateBoard();
                // Swap back
                swap(i, j, i + 1, j);
    
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { column1: i, row1: j, column2: i + 1, row2: j };
                }
            }
        }
    
        for (let i = 0; i < level.columns; i++) {
            for (let j = 0; j < level.rows - 1; j++) {
                // Swap tiles
                swap(i, j, i, j + 1);
                // Evaluate the board
                const score = evaluateBoard();
                // Swap back
                swap(i, j, i, j + 1);
    
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { column1: i, row1: j, column2: i, row2: j + 1 };
                }
            }
        }
    
        return bestMove;
    }
};

interface Tile {
    type: number;
    shift: number;
  }
  
  interface SelectedTile {
    selected: boolean;
    column: number;
    row: number;
  }
  
  interface Level {
    x: number;
    y: number;
    columns: number;
    rows: number;
    tilewidth: number;
    tileheight: number;
    tiles: Tile[][];
    selectedtile: SelectedTile;
  }
  
  interface Move {
    column1: number;
    row1: number;
    column2: number;
    row2: number;
  }
  
  interface Cluster {
    column: number;
    row: number;
    length: number;
    horizontal: boolean;
  }
  
  interface Button {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
  }
  