window.onload = function() {
    const canvas = document.getElementById("viewport") as HTMLCanvasElement;
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;

    // Resize canvas to fit the window
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        level.tilewidth = canvas.width / level.columns;
        level.tileheight = canvas.height / level.rows;
        render();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Add touch event listeners
    canvas.addEventListener("touchstart", onTouchStart);
    canvas.addEventListener("touchmove", onTouchMove);
    canvas.addEventListener("touchend", onTouchEnd);

    // Initialize the game
    init();

    function onTouchStart(e: TouchEvent) {
        const touch = e.touches[0];
        const pos = getMousePos(canvas, touch);
        const mouseEvent = new MouseEvent("mousedown", {
            clientX: pos.x,
            clientY: pos.y
        });
        onMouseDown(mouseEvent);
    }

    function onTouchMove(e: TouchEvent) {
        const touch = e.touches[0];
        const pos = getMousePos(canvas, touch);
        const mouseEvent = new MouseEvent("mousemove", {
            clientX: pos.x,
            clientY: pos.y
        });
        onMouseMove(mouseEvent);
    }

    function onTouchEnd(e: TouchEvent) {
        const mouseEvent = new MouseEvent("mouseup", {
            clientX: 0,
            clientY: 0
        });
        onMouseUp(mouseEvent);
    }

    // Rest of your game code...

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
                    findMoves();
                    if (moves.length > 0) {
                        const move = moves[Math.floor(Math.random() * moves.length)];
                        mouseSwap(move.column1, move.row1, move.column2, move.row2);
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

    function render() {
        drawFrame();
        context.fillStyle = "#000000";
        context.font = "24px Verdana";
        drawCenterText("Score:", 30, level.y + 40, 150);
        drawCenterText(score.toString(), 30, level.y + 70, 150);
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
        context.fillText("Match3 Example - Rembound.com", 10, 30);

        // Display fps
        context.fillStyle = "#ffffff";
        context.font = "12px Verdana";
        context.fillText(`Fps: ${fps}`, 13, 50);
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

    function findClusters() {
        clusters = [];

        for (let j = 0; j < level.rows; j++) {
            let matchlength = 1;
            for (let i = 0; i < level.columns; i++) {
                let checkcluster = false;

                if (i === level.columns - 1) {
                    checkcluster = true;
                } else {
                    if (level.tiles[i][j].type === level.tiles[i + 1][j].type && level.tiles[i][j].type !== -1) {
                        matchlength += 1;
                    } else {
                        checkcluster = true;
                    }
                }

                if (checkcluster) {
                    if (matchlength >= 3) {
                        clusters.push({ column: i + 1 - matchlength, row: j, length: matchlength, horizontal: true });
                    }
                    matchlength = 1;
                }
            }
        }

        for (let i = 0; i < level.columns; i++) {
            let matchlength = 1;
            for (let j = 0; j < level.rows; j++) {
                let checkcluster = false;

                if (j === level.rows - 1) {
                    checkcluster = true;
                } else {
                    if (level.tiles[i][j].type === level.tiles[i][j + 1].type && level.tiles[i][j].type !== -1) {
                        matchlength += 1;
                    } else {
                        checkcluster = true;
                    }
                }

                if (checkcluster) {
                    if (matchlength >= 3) {
                        clusters.push({ column: i, row: j + 1 - matchlength, length: matchlength, horizontal: false });
                    }
                    matchlength = 1;
                }
            }
        }
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

    function loopClusters(func