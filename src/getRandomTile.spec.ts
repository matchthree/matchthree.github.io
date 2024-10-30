import { getRandomTile, tilecolors, swap, level } from './gameLogic';

describe('getRandomTile', () => {
    it('should return a valid tile type', () => {
        const tile = getRandomTile();
        expect(tile).toBeGreaterThanOrEqual(0);
        expect(tile).toBeLessThan(tilecolors.length);
    });
});

describe('swap', () => {
    it('should swap two tiles', () => {
        const tile1 = level.tiles[0][0];
        const tile2 = level.tiles[1][0];
        swap(0, 0, 1, 0);
        expect(level.tiles[0][0]).toBe(tile2);
        expect(level.tiles[1][0]).toBe(tile1);
    });
});
