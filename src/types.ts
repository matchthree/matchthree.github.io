export interface Cluster {
    column: number;
    row: number;
    length: number;
    horizontal: boolean;
}

export interface Move {
    column1: number;
    column2: number;
    row1: number;
    row2: number;
}

export interface Tile {
    row: number;
    column: number;
    type: number;
    shift: number;
    selected?: boolean;
}
