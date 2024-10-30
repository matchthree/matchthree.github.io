import { GameState } from "./types";
export const GAME_CONFIG = {
    ANIMATION_TIME_TOTAL: 0.3,
    INITIAL_LEVEL: {
        x: 250,
        y: 113,
        columns: 8,
        rows: 8,
        tilewidth: 40,
        tileheight: 40
    },
    TILE_COLORS: [
        [255, 128, 128],
        [128, 255, 128],
        [128, 128, 255],
        [255, 255, 128],
        [255, 128, 255],
        [128, 255, 255],
        [255, 255, 255]
    ],
    BUTTONS: [
        { x: 30, y: 240, width: 150, height: 50, text: "New Game" },
        { x: 30, y: 300, width: 150, height: 50, text: "Show Moves" },
        { x: 30, y: 360, width: 150, height: 50, text: "Enable AI Bot" }
    ]
};

export const GAME_STATES: GameState = {
    init: 0,
    ready: 1,
    resolve: 2
};
