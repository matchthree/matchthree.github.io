export const tilecolors: number[][] = [
    [255, 128, 128],
    [128, 255, 128],
    [128, 128, 255],
    [255, 255, 128],
    [255, 128, 255],
    [128, 255, 255],
    [255, 255, 255]
];

export const level: Level = {
    x: 250,
    y: 113,
    columns: 8,
    rows: 8,
    tilewidth: 40,
    tileheight: 40,
    tiles: [],
    selectedtile: { selected: false, column: 0, row: 0 }
};

// Initialize the two-dimensional tile array
for (let i = 0; i < level.columns; i++) {
    level.tiles[i] = [];
    for (let j = 0; j < level.rows; j++) {
        level.tiles[i][j] = { type: getRandomTile(), shift: 0 };
    }
}

export function getRandomTile() {
    return Math.floor(Math.random() * tilecolors.length);
}

export function swap(x1: number, y1: number, x2: number, y2: number) {
    const typeswap = level.tiles[x1][y1].type;
    level.tiles[x1][y1].type = level.tiles[x2][y2].type;
    level.tiles[x2][y2].type = typeswap;
}

export function findClusters() {
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

export function findMoves() {
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

export function removeClusters() {
    loopClusters((index, column, row, cluster) => {
        console.info({ index });
        console.info({ cluster });
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

export function shiftTiles() {
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

export function loopClusters(func: (index: number, column: number, row: number, cluster: Cluster) => void) {
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

let clusters: Cluster[] = [];
let moves: Move[] = [];
