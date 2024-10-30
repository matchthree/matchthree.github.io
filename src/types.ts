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
    selected?: boolean;
}

// Function to create a Tile with default selected value
export function createTile(row: number, column: number, selected: boolean = false): Tile {
    return { row, column, selected };
}

// Example usage
// const tile: Tile = createTile(1, 2);
// const selectedTile: Tile = createTile(1, 2, true);
//
// console.log(tile); // Output: { row: 1, column: 2, selected: false }
// console.log(selectedTile); // Output: { row: 1, column: 2, selected: true }
