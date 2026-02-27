import { Graphics, Ticker } from 'pixi.js';

export type HeroType = 'warrior' | 'mage' | 'ranger' | 'tank' | 'paladin';

export interface HeroVisual {
    graphics: Graphics;
    type: HeroType;
}

// ──────────────────────────────────────
//  Color Palettes (13 colors each)
// ──────────────────────────────────────

const WARRIOR_COLORS = [
    0x000000, 0xffccaa, 0x888888, 0x555555, 0xcc3333, 0xff4444, 0xff6666,
    0x000000, 0xffffff, 0x333333, 0xaa7744, 0xffcc00, 0xff8800
];

const MAGE_COLORS = [
    0x000000, 0xffccaa, 0x4444aa, 0x6666cc, 0x8888ee, 0x00ccff, 0x0088ff,
    0x000000, 0xffffff, 0x333355, 0xaa7744, 0xffcc00, 0xcc88ff
];

const RANGER_COLORS = [
    0x000000, 0xffccaa, 0x556633, 0x77884d, 0x99aa66, 0x88cc44, 0xaadd66,
    0x000000, 0xffffff, 0x443322, 0x886644, 0x665533, 0xccaa77
];

const TANK_COLORS = [
    0x000000, 0x223366, 0x335599, 0x4477bb, 0x5599dd, 0xffcc00, 0xffdd44,
    0x00ffff, 0xffffff, 0x112244, 0xaa8833, 0x887766, 0xaaaaaa
];

const PALADIN_COLORS = [
    0x000000, 0xffccaa, 0xeeeeee, 0xcccccc, 0xffcc00, 0xffdd44, 0x3366aa,
    0x000000, 0xffffff, 0x888888, 0x4488cc, 0xffee88, 0xaa8833
];

// ──────────────────────────────────────
//  Pixel Art Grids (20×20)
// ──────────────────────────────────────

const WARRIOR_ART = [
    [0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 3, 4, 4, 4, 4, 3, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 3, 4, 4, 5, 5, 4, 4, 3, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 4, 2, 2, 2, 2, 2, 2, 4, 3, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 2, 11, 11, 11, 11, 11, 11, 2, 3, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 2, 1, 1, 1, 1, 1, 1, 2, 3, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 2, 1, 7, 1, 1, 7, 1, 2, 3, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 2, 1, 1, 1, 1, 1, 1, 8, 3, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 3, 10, 10, 10, 10, 10, 10, 3, 3, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 5, 0, 3, 4, 4, 4, 4, 4, 3, 0, 5, 0, 0, 0, 0, 0],
    [0, 0, 0, 5, 4, 9, 4, 4, 2, 2, 2, 4, 4, 9, 4, 5, 0, 0, 0, 0],
    [0, 0, 0, 0, 4, 4, 4, 2, 8, 2, 2, 8, 2, 4, 4, 0, 12, 0, 0, 0],
    [0, 0, 0, 0, 3, 4, 4, 2, 10, 10, 10, 2, 4, 4, 3, 12, 12, 0, 0, 0],
    [0, 0, 0, 9, 3, 4, 4, 2, 2, 2, 2, 2, 4, 4, 3, 0, 12, 0, 0, 0],
    [0, 0, 9, 3, 3, 4, 8, 4, 4, 4, 4, 8, 4, 3, 3, 0, 6, 0, 0, 0],
    [0, 0, 0, 4, 4, 10, 10, 10, 10, 10, 10, 10, 10, 4, 4, 0, 0, 0, 0, 0],
    [0, 0, 0, 4, 4, 9, 4, 4, 0, 4, 4, 9, 4, 4, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 3, 3, 9, 9, 0, 9, 9, 3, 3, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 9, 9, 9, 0, 0, 0, 9, 9, 9, 0, 0, 0, 0, 0, 0, 0],
];

const MAGE_ART = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 2, 3, 8, 3, 3, 2, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 3, 3, 3, 8, 3, 3, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 2, 9, 1, 1, 1, 1, 1, 1, 9, 2, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 2, 9, 1, 7, 1, 1, 7, 1, 9, 2, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 1, 1, 1, 1, 1, 1, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 2, 3, 3, 3, 3, 2, 2, 0, 0, 0, 5, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 3, 4, 3, 3, 4, 3, 2, 0, 0, 5, 6, 5, 0],
    [0, 0, 0, 0, 1, 9, 2, 3, 8, 3, 3, 3, 3, 2, 0, 0, 0, 10, 0, 0],
    [0, 0, 0, 0, 0, 1, 2, 3, 3, 3, 3, 3, 3, 2, 1, 0, 0, 10, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 10, 10, 10, 10, 10, 10, 2, 0, 0, 0, 10, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 3, 3, 8, 3, 3, 3, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 0, 0, 0, 0],
    [0, 0, 0, 2, 3, 3, 8, 3, 3, 3, 3, 3, 8, 3, 3, 3, 2, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 9, 9, 9, 0, 9, 9, 9, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 9, 9, 9, 0, 9, 9, 9, 0, 0, 0, 0, 0, 0, 0],
];

const RANGER_ART = [
    [0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 2, 3, 3, 3, 3, 2, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 3, 3, 4, 3, 3, 3, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 2, 3, 1, 1, 1, 1, 1, 1, 3, 2, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 2, 3, 1, 7, 1, 1, 7, 1, 3, 2, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 1, 1, 1, 1, 1, 1, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 9, 10, 9, 9, 10, 9, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 0, 12, 12, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 9, 3, 3, 3, 3, 3, 3, 3, 0, 12, 12, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 10, 3, 10, 10, 10, 10, 3, 3, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 11, 0, 0, 1, 3, 3, 3, 3, 3, 3, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 11, 0, 0, 0, 0, 9, 3, 3, 3, 3, 9, 0, 0, 0, 0, 0, 0, 0, 0],
    [11, 12, 0, 0, 0, 0, 9, 10, 10, 10, 10, 9, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 11, 0, 0, 0, 9, 3, 3, 3, 3, 3, 3, 9, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 11, 0, 0, 9, 3, 3, 3, 3, 3, 3, 9, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 9, 9, 0, 0, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 9, 10, 10, 0, 0, 10, 10, 9, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 9, 9, 9, 0, 0, 9, 9, 9, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 9, 9, 9, 0, 0, 9, 9, 9, 0, 0, 0, 0, 0, 0, 0],
];

const TANK_ART = [
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 5, 5, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 2, 2, 5, 5, 2, 2, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 2, 2, 3, 3, 3, 3, 2, 2, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 2, 2, 7, 9, 9, 7, 2, 2, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 5, 5, 1, 5, 5, 5, 5, 5, 5, 1, 5, 5, 0, 0, 0, 0],
    [0, 0, 0, 5, 2, 2, 1, 2, 3, 3, 3, 3, 2, 1, 2, 2, 5, 0, 12, 0],
    [0, 0, 0, 0, 9, 2, 1, 2, 8, 2, 2, 8, 2, 1, 2, 9, 0, 0, 11, 0],
    [0, 0, 5, 5, 5, 2, 2, 2, 2, 5, 5, 2, 2, 2, 2, 5, 5, 5, 11, 0],
    [0, 0, 5, 10, 5, 2, 2, 2, 5, 10, 10, 5, 2, 2, 2, 5, 10, 5, 11, 0],
    [0, 0, 5, 5, 5, 2, 2, 2, 2, 5, 5, 2, 2, 2, 2, 5, 5, 5, 0, 0],
    [0, 0, 0, 0, 9, 1, 2, 2, 2, 2, 2, 2, 2, 1, 9, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 5, 5, 5, 5, 5, 5, 5, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 2, 2, 2, 1, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 2, 2, 5, 2, 1, 2, 5, 2, 2, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 2, 2, 2, 0, 0, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 9, 9, 9, 0, 0, 9, 9, 9, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 9, 9, 9, 9, 0, 0, 9, 9, 9, 9, 0, 0, 0, 0, 0, 0],
];

const PALADIN_ART = [
    [0, 0, 0, 0, 0, 0, 0, 0, 3, 4, 4, 3, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 3, 2, 4, 4, 2, 3, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 3, 2, 2, 2, 2, 2, 2, 3, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 2, 2, 4, 4, 4, 4, 2, 2, 3, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 2, 1, 1, 1, 1, 1, 1, 2, 3, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 2, 1, 7, 1, 1, 7, 1, 2, 3, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 3, 1, 1, 1, 1, 1, 1, 3, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 6, 0, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 11, 0, 0],
    [0, 0, 0, 6, 6, 4, 3, 2, 4, 2, 2, 4, 2, 3, 0, 0, 0, 11, 0, 0],
    [0, 0, 0, 6, 10, 9, 3, 2, 8, 2, 2, 8, 2, 3, 0, 0, 0, 11, 0, 0],
    [0, 0, 0, 6, 6, 0, 12, 2, 2, 4, 4, 2, 2, 12, 0, 0, 0, 8, 0, 0],
    [0, 0, 0, 6, 10, 0, 12, 2, 4, 5, 5, 4, 2, 12, 0, 0, 0, 8, 0, 0],
    [0, 0, 0, 6, 6, 0, 12, 2, 2, 4, 4, 2, 2, 12, 0, 0, 0, 11, 0, 0],
    [0, 0, 0, 0, 6, 0, 0, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 3, 4, 4, 4, 4, 4, 4, 3, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 3, 2, 2, 3, 2, 2, 3, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 2, 2, 4, 3, 4, 2, 2, 3, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 2, 2, 2, 0, 2, 2, 2, 3, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 9, 3, 3, 3, 0, 3, 3, 3, 9, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 9, 9, 9, 9, 0, 9, 9, 9, 9, 0, 0, 0, 0, 0, 0],
];

// ──────────────────────────────────────
//  Hero Factory
// ──────────────────────────────────────

export class HeroFactory {
    private static readonly P_SIZE = 3;

    /**
     * Draw a hero Graphics sprite based on the hero type.
     */
    public static drawHero(type: HeroType, screenHeight: number): Graphics {
        const g = new Graphics();
        const pSize = HeroFactory.P_SIZE;
        let colors: number[];
        let art: number[][];

        switch (type) {
            case 'warrior': colors = WARRIOR_COLORS; art = WARRIOR_ART; break;
            case 'mage': colors = MAGE_COLORS; art = MAGE_ART; break;
            case 'ranger': colors = RANGER_COLORS; art = RANGER_ART; break;
            case 'tank': colors = TANK_COLORS; art = TANK_ART; break;
            case 'paladin': colors = PALADIN_COLORS; art = PALADIN_ART; break;
        }

        // Draw pixel grid
        for (let r = 0; r < art.length; r++) {
            for (let c = 0; c < art[r].length; c++) {
                const px = art[r][c];
                if (px !== 0) {
                    g.rect(c * pSize, r * pSize, pSize, pSize).fill({ color: colors[px] });
                }
            }
        }

        // Idle effects
        HeroFactory.createIdleEffect(type, g, pSize, art, screenHeight);

        // Shadow
        g.rect(2 * pSize, art.length * pSize, (art[0].length - 4) * pSize, pSize / 2)
            .fill({ color: 0x000000, alpha: 0.3 });

        return g;
    }

    // ──────────────────────────────────────
    //  Idle Animations
    // ──────────────────────────────────────

    private static createIdleEffect(type: HeroType, g: Graphics, pSize: number, art: number[][], screenHeight: number): void {
        // Breathing effect (all heroes)
        HeroFactory.createBreathingEffect(g, pSize, art.length, screenHeight);

        // Hero-specific weapon glow
        switch (type) {
            case 'warrior':
                HeroFactory.createWeaponGlow(g, pSize, [
                    { x: 16, y: 11, color: 0xff4444, alpha: 0.9 },
                    { x: 16, y: 12, color: 0xff6666, alpha: 0.8 },
                    { x: 16, y: 13, color: 0xff4444, alpha: 0.7 },
                    { x: 16, y: 14, color: 0xff6666, alpha: 0.6 },
                ], 150);
                break;
            case 'mage':
                HeroFactory.createWeaponGlow(g, pSize, [
                    { x: 17, y: 9, color: 0x00ccff, alpha: 0.95 },
                    { x: 16, y: 10, color: 0x00ccff, alpha: 0.8 },
                    { x: 18, y: 10, color: 0x00ccff, alpha: 0.8 },
                    { x: 17, y: 10, color: 0xffffff, alpha: 1.0 },
                ], 180);
                break;
            case 'ranger':
                HeroFactory.createWeaponGlow(g, pSize, [
                    { x: 1, y: 11, color: 0x88cc44, alpha: 0.7 },
                    { x: 1, y: 12, color: 0x88cc44, alpha: 0.6 },
                    { x: 0, y: 13, color: 0xaadd66, alpha: 0.8 },
                    { x: 1, y: 14, color: 0x88cc44, alpha: 0.7 },
                ], 250);
                break;
            case 'tank':
                HeroFactory.createWeaponGlow(g, pSize, [
                    { x: 5, y: 10, color: 0xffcc00, alpha: 0.6 },
                    { x: 14, y: 10, color: 0xffcc00, alpha: 0.6 },
                    { x: 9, y: 10, color: 0xffdd44, alpha: 0.4 },
                    { x: 10, y: 10, color: 0xffdd44, alpha: 0.4 },
                ], 300);
                break;
            case 'paladin':
                HeroFactory.createWeaponGlow(g, pSize, [
                    { x: 17, y: 7, color: 0xffee88, alpha: 0.9 },
                    { x: 17, y: 8, color: 0xffcc00, alpha: 0.8 },
                    { x: 17, y: 9, color: 0xffcc00, alpha: 0.7 },
                    { x: 17, y: 10, color: 0xffffff, alpha: 0.9 },
                ], 200);
                break;
        }
    }

    private static createBreathingEffect(g: Graphics, pSize: number, height: number, screenHeight: number): void {
        const animate = () => {
            if (g.destroyed) { Ticker.shared.remove(animate); return; }
            const cycle = Math.sin(Date.now() / 800) * 0.02;
            g.scale.y = 1 + cycle;
            g.y = screenHeight * 0.666 + (1 - g.scale.y) * height * pSize;
        };
        Ticker.shared.add(animate);
    }

    private static createWeaponGlow(g: Graphics, pSize: number, points: { x: number; y: number; color: number; alpha: number }[], speed: number): void {
        const glow = new Graphics();
        for (const p of points) {
            glow.rect(p.x * pSize, p.y * pSize, pSize, pSize).fill({ color: p.color, alpha: p.alpha });
        }
        g.addChild(glow);
        const animate = () => {
            if (glow.destroyed) { Ticker.shared.remove(animate); return; }
            glow.alpha = 0.7 + Math.sin(Date.now() / speed) * 0.3;
        };
        Ticker.shared.add(animate);
    }

    // ──────────────────────────────────────
    //  Attack Effects (called from CombatScene)
    // ──────────────────────────────────────

    /**
     * Create a slash/projectile effect from hero to target.
     * Returns color used for particles.
     */
    public static createAttackEffect(
        type: HeroType,
        container: import('pixi.js').Container,
        heroSprite: Graphics,
        targetX: number,
        targetY: number,
        combo: number
    ): { slashColor: number; particleColor: number } {
        switch (type) {
            case 'warrior':
                return HeroFactory.createWarriorSlash(container, heroSprite, targetX, targetY, combo);
            case 'mage':
                return HeroFactory.createMageProjectile(container, heroSprite, targetX, targetY, combo);
            case 'ranger':
                return HeroFactory.createRangerArrow(container, heroSprite, targetX, targetY, combo);
            case 'tank':
                return HeroFactory.createTankShieldBash(container, heroSprite, targetX, targetY, combo);
            case 'paladin':
                return HeroFactory.createPaladinHolyStrike(container, heroSprite, targetX, targetY, combo);
        }
    }

    // -- Warrior: Red sword slash arc --
    private static createWarriorSlash(container: import('pixi.js').Container, heroSprite: Graphics, targetX: number, targetY: number, combo: number): { slashColor: number; particleColor: number } {
        const slash = new Graphics();
        container.addChild(slash);
        const startTime = Date.now();
        const color = combo >= 10 ? 0xff8800 : 0xff4444;
        const width = Math.min(8 + combo, 20);

        const animate = () => {
            const progress = (Date.now() - startTime) / 400;
            if (progress >= 1 || slash.destroyed) { Ticker.shared.remove(animate); if (!slash.destroyed) slash.destroy(); return; }
            slash.clear();
            const alpha = 1 - progress;
            const heroX = heroSprite.x + 30;
            const heroY = heroSprite.y + 10;
            slash.moveTo(heroX, heroY)
                .quadraticCurveTo(heroX + (targetX - heroX) / 2, heroY - 60, targetX, targetY)
                .stroke({ width: width * (1 - progress), color, alpha });

            // Fire burst at combo >= 10
            if (combo >= 10 && progress > 0.5 && progress < 0.55) {
                HeroFactory.createShockwave(container, targetX, targetY, 0xff4400, 50);
            }
        };
        Ticker.shared.add(animate);
        return { slashColor: color, particleColor: combo >= 10 ? 0xff4400 : 0xff4444 };
    }

    // -- Mage: Magic projectile --
    private static createMageProjectile(container: import('pixi.js').Container, heroSprite: Graphics, targetX: number, targetY: number, combo: number): { slashColor: number; particleColor: number } {
        const projectile = new Graphics();
        const isFireball = combo >= 5;
        const size = isFireball ? 12 : (4 + Math.min(combo, 8));
        const color = isFireball ? 0xff4400 : (combo >= 3 ? 0xcc88ff : 0x00ccff);

        projectile.circle(0, 0, size).fill({ color, alpha: 0.9 });
        if (isFireball) {
            projectile.circle(0, 0, size + 4).fill({ color: 0xff6600, alpha: 0.3 });
        }
        container.addChild(projectile);

        const startX = heroSprite.x + 50;
        const startY = heroSprite.y + 25;
        projectile.x = startX;
        projectile.y = startY;
        const startTime = Date.now();
        const duration = isFireball ? 500 : 350;

        const animate = () => {
            const progress = (Date.now() - startTime) / duration;
            if (progress >= 1 || projectile.destroyed) {
                Ticker.shared.remove(animate);
                if (!projectile.destroyed) projectile.destroy();
                return;
            }
            projectile.x = startX + (targetX - startX) * progress;
            projectile.y = startY + (targetY - startY) * progress;
            projectile.alpha = 1 - progress * 0.3;

            // Trail particles
            if (Math.random() < 0.4) {
                const trail = new Graphics();
                trail.rect(0, 0, 3, 3).fill({ color: isFireball ? 0xff8844 : color, alpha: 0.7 });
                trail.x = projectile.x + (Math.random() - 0.5) * 8;
                trail.y = projectile.y + (Math.random() - 0.5) * 8;
                container.addChild(trail);
                const trailStart = Date.now();
                const trailAnim = () => {
                    const tp = (Date.now() - trailStart) / 300;
                    if (tp >= 1 || trail.destroyed) { Ticker.shared.remove(trailAnim); if (!trail.destroyed) trail.destroy(); return; }
                    trail.alpha = 1 - tp;
                    trail.y -= 1;
                };
                Ticker.shared.add(trailAnim);
            }
        };
        Ticker.shared.add(animate);
        return { slashColor: color, particleColor: isFireball ? 0xff6600 : 0x00ccff };
    }

    // -- Ranger: Arrow shot --
    private static createRangerArrow(container: import('pixi.js').Container, heroSprite: Graphics, targetX: number, targetY: number, combo: number): { slashColor: number; particleColor: number } {
        const arrow = new Graphics();
        const color = combo >= 3 ? 0x556633 : 0x88cc44;
        arrow.rect(0, 0, 10, 3).fill({ color: 0xccaa77 });
        arrow.moveTo(10, -2).lineTo(14, 1.5).lineTo(10, 5).fill({ color: 0x888888 });
        container.addChild(arrow);

        const startX = heroSprite.x + 20;
        const startY = heroSprite.y + 30;
        arrow.x = startX;
        arrow.y = startY;
        const startTime = Date.now();
        const speed = combo >= 3 ? 250 : 350;

        const animate = () => {
            const progress = (Date.now() - startTime) / speed;
            if (progress >= 1 || arrow.destroyed) {
                Ticker.shared.remove(animate);
                if (!arrow.destroyed) arrow.destroy();
                return;
            }
            arrow.x = startX + (targetX - startX) * progress;
            arrow.y = startY + (targetY - startY) * progress;

            // Green trail
            if (Math.random() < 0.5) {
                const trail = new Graphics();
                trail.rect(0, 0, 2, 2).fill({ color, alpha: 0.6 });
                trail.x = arrow.x;
                trail.y = arrow.y + (Math.random() - 0.5) * 4;
                container.addChild(trail);
                const trailStart = Date.now();
                const trailAnim = () => {
                    const tp = (Date.now() - trailStart) / 400;
                    if (tp >= 1 || trail.destroyed) { Ticker.shared.remove(trailAnim); if (!trail.destroyed) trail.destroy(); return; }
                    trail.alpha = 1 - tp;
                };
                Ticker.shared.add(trailAnim);
            }
        };
        Ticker.shared.add(animate);
        return { slashColor: color, particleColor: 0x88cc44 };
    }

    // -- Tank: Shield bash shockwave --
    private static createTankShieldBash(container: import('pixi.js').Container, heroSprite: Graphics, targetX: number, targetY: number, combo: number): { slashColor: number; particleColor: number } {
        const color = 0x4477bb;
        const radius = 20 + Math.min(combo * 3, 30);

        // Dash line to target
        const slash = new Graphics();
        container.addChild(slash);
        const startTime = Date.now();

        const animate = () => {
            const progress = (Date.now() - startTime) / 350;
            if (progress >= 1 || slash.destroyed) { Ticker.shared.remove(animate); if (!slash.destroyed) slash.destroy(); return; }
            slash.clear();
            const alpha = 1 - progress;
            slash.moveTo(heroSprite.x + 40, heroSprite.y + 25)
                .lineTo(targetX, targetY)
                .stroke({ width: 6 * (1 - progress), color, alpha });
        };
        Ticker.shared.add(animate);

        // Shockwave at target after slight delay
        setTimeout(() => {
            HeroFactory.createShockwave(container, targetX, targetY, color, radius);
        }, 200);

        return { slashColor: color, particleColor: 0x4477bb };
    }

    // -- Paladin: Golden holy strike --
    private static createPaladinHolyStrike(container: import('pixi.js').Container, heroSprite: Graphics, targetX: number, targetY: number, combo: number): { slashColor: number; particleColor: number } {
        const color = combo >= 10 ? 0xffffff : 0xffcc00;
        const width = Math.min(8 + combo, 18);
        const slash = new Graphics();
        container.addChild(slash);
        const startTime = Date.now();

        const animate = () => {
            const progress = (Date.now() - startTime) / 400;
            if (progress >= 1 || slash.destroyed) { Ticker.shared.remove(animate); if (!slash.destroyed) slash.destroy(); return; }
            slash.clear();
            const alpha = 1 - progress;
            const heroX = heroSprite.x + 30;
            const heroY = heroSprite.y + 10;
            slash.moveTo(heroX, heroY)
                .quadraticCurveTo(heroX + (targetX - heroX) / 2, heroY - 40, targetX, targetY)
                .stroke({ width: width * (1 - progress), color, alpha });
        };
        Ticker.shared.add(animate);

        // Cross light at combo >= 10
        if (combo >= 10) {
            setTimeout(() => {
                HeroFactory.createCrossLight(container, targetX, targetY);
            }, 250);
        }

        return { slashColor: color, particleColor: combo >= 10 ? 0xffee88 : 0xffcc00 };
    }

    // ──────────────────────────────────────
    //  Shared VFX Helpers
    // ──────────────────────────────────────

    /**
     * Expanding circular shockwave.
     */
    public static createShockwave(container: import('pixi.js').Container, x: number, y: number, color: number, maxRadius: number): void {
        const wave = new Graphics();
        container.addChild(wave);
        const startTime = Date.now();

        const animate = () => {
            const progress = (Date.now() - startTime) / 500;
            if (progress >= 1 || wave.destroyed) { Ticker.shared.remove(animate); if (!wave.destroyed) wave.destroy(); return; }
            wave.clear();
            const r = maxRadius * progress;
            wave.circle(x, y, r).stroke({ width: 3 * (1 - progress), color, alpha: 1 - progress });
        };
        Ticker.shared.add(animate);
    }

    /**
     * Paladin's cross light burst.
     */
    private static createCrossLight(container: import('pixi.js').Container, x: number, y: number): void {
        const cross = new Graphics();
        container.addChild(cross);
        const startTime = Date.now();

        const animate = () => {
            const progress = (Date.now() - startTime) / 600;
            if (progress >= 1 || cross.destroyed) { Ticker.shared.remove(animate); if (!cross.destroyed) cross.destroy(); return; }
            cross.clear();
            const alpha = 1 - progress;
            const len = 40 * progress;
            const w = 6 * (1 - progress);
            // Vertical beam
            cross.rect(x - w / 2, y - len, w, len * 2).fill({ color: 0xffffff, alpha });
            // Horizontal beam
            cross.rect(x - len, y - w / 2, len * 2, w).fill({ color: 0xffffff, alpha });
        };
        Ticker.shared.add(animate);
    }

    /**
     * Tank low-HP golden shield aura (called from CombatScene update).
     */
    public static createLowHpShield(_container: import('pixi.js').Container, heroSprite: Graphics): Graphics {
        const shield = new Graphics();
        shield.circle(heroSprite.width / 2, heroSprite.height / 2, 35)
            .stroke({ width: 3, color: 0xffcc00, alpha: 0.6 });
        heroSprite.addChild(shield);

        const animate = () => {
            if (shield.destroyed) { Ticker.shared.remove(animate); return; }
            shield.alpha = 0.4 + Math.sin(Date.now() / 300) * 0.3;
        };
        Ticker.shared.add(animate);
        return shield;
    }

    // ──────────────────────────────────────
    //  Hero Display Names
    // ──────────────────────────────────────

    public static getHeroName(type: HeroType): string {
        switch (type) {
            case 'warrior': return '戰士';
            case 'mage': return '法師';
            case 'ranger': return '遊俠';
            case 'tank': return '坦克';
            case 'paladin': return '聖騎士';
        }
    }

    public static getHeroIcon(type: HeroType): string {
        switch (type) {
            case 'warrior': return '🗡️';
            case 'mage': return '🔮';
            case 'ranger': return '🏹';
            case 'tank': return '🛡️';
            case 'paladin': return '⚔️';
        }
    }

    public static getAllTypes(): HeroType[] {
        return ['warrior', 'mage', 'ranger', 'tank', 'paladin'];
    }
}
