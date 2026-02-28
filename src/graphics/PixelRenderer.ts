/**
 * PixelRenderer — Procedural pixel art engine.
 *
 * Technique: Render a 2D numeric grid where each number maps to a color
 * in the palette. Zero (0) = transparent. PixiJS `Graphics.rect()` draws
 * each non-zero cell as a filled square of `pixelSize` pixels.
 *
 * Usage:
 *   const g = PixelRenderer.render(ART_GRID, COLOR_PALETTE, 3);
 *   container.addChild(g);
 */

import { Graphics } from 'pixi.js';

export type PixelGrid = number[][];
export type ColorPalette = number[];

export class PixelRenderer {
    /**
     * Draw a pixel art grid using the given color palette.
     * @param art 2D array of palette indices (0 = skip)
     * @param colors Color palette array
     * @param pixelSize Size of each pixel square (default 3)
     * @returns A PixiJS Graphics object
     */
    public static render(art: PixelGrid, colors: ColorPalette, pixelSize: number = 3): Graphics {
        const g = new Graphics();
        for (let r = 0; r < art.length; r++) {
            for (let c = 0; c < art[r].length; c++) {
                const px = art[r][c];
                if (px !== 0) {
                    g.rect(c * pixelSize, r * pixelSize, pixelSize, pixelSize)
                        .fill({ color: colors[px] });
                }
            }
        }
        return g;
    }

    /**
     * Draw a pixel art grid with per-pixel alpha support.
     * @param art 2D array of palette indices
     * @param colors Color palette array
     * @param alphas Alpha palette array (same length as colors)
     * @param pixelSize Size of each pixel square
     */
    public static renderWithAlpha(
        art: PixelGrid,
        colors: ColorPalette,
        alphas: number[],
        pixelSize: number = 3
    ): Graphics {
        const g = new Graphics();
        for (let r = 0; r < art.length; r++) {
            for (let c = 0; c < art[r].length; c++) {
                const px = art[r][c];
                if (px !== 0) {
                    g.rect(c * pixelSize, r * pixelSize, pixelSize, pixelSize)
                        .fill({ color: colors[px], alpha: alphas[px] ?? 1 });
                }
            }
        }
        return g;
    }

    /**
     * Render and add a shadow underneath the sprite.
     * @param g The Graphics sprite to add shadow to
     * @param art The art grid used for width calculation
     * @param pixelSize Pixel size
     * @param inset Number of columns to inset on each side (default 2)
     */
    public static addShadow(
        g: Graphics,
        art: PixelGrid,
        pixelSize: number = 3,
        inset: number = 2
    ): void {
        const width = (art[0].length - inset * 2) * pixelSize;
        const x = inset * pixelSize;
        const y = art.length * pixelSize;
        g.rect(x, y, width, pixelSize / 2).fill({ color: 0x000000, alpha: 0.3 });
    }

    /**
     * Get the dimensions of a pixel art grid in actual pixels.
     */
    public static getDimensions(art: PixelGrid, pixelSize: number = 3): { width: number; height: number } {
        return {
            width: art[0].length * pixelSize,
            height: art.length * pixelSize,
        };
    }
}
