export interface Tile {
    type: number;
    shift: number;
}

export interface SelectedTile {
    selected: boolean;
    column: number;
    row: number;
}

export interface Level {
    x: number;
    y: number;
    columns: number;
    rows: number;
    tilewidth: number;
    tileheight: number;
    tiles: Tile[][];
    selectedtile: SelectedTile;
}

export interface Move {
    column1: number;
    row1: number;
    column2: number;
    row2: number;
}

export interface Cluster {
    column: number;
    row: number;
    length: number;
    horizontal: boolean;
}

export interface Button {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
}

export interface GameState {
    init: number;
    ready: number;
    resolve: number;
}
