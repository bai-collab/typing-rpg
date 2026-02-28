/**
 * SpriteAnimator — Ticker-based animation helpers for pixel sprites.
 *
 * Provides breathing, jiggle, glow, and pulse effects.
 * All animations auto-stop when the target Graphics object is destroyed.
 *
 * Usage:
 *   SpriteAnimator.breathing(sprite, pixelSize, gridHeight, screenY);
 *   SpriteAnimator.jiggle(sprite, pixelSize, gridHeight, screenY);
 *   SpriteAnimator.weaponGlow(sprite, pixelSize, points, speed);
 */

import { Graphics, Ticker } from 'pixi.js';

export interface GlowPoint {
    x: number;
    y: number;
    color: number;
    alpha: number;
}

export class SpriteAnimator {
    /**
     * Breathing effect — gentle vertical scale oscillation.
     * @param g The Graphics sprite
     * @param pixelSize Pixel size
     * @param gridHeight Number of rows in the art grid
     * @param baseY The base Y position
     * @param speed Breathing speed (ms per cycle, default 800)
     */
    public static breathing(
        g: Graphics,
        pixelSize: number,
        gridHeight: number,
        baseY: number,
        speed: number = 800
    ): void {
        const animate = () => {
            if (g.destroyed) { Ticker.shared.remove(animate); return; }
            const cycle = Math.sin(Date.now() / speed) * 0.02;
            g.scale.y = 1 + cycle;
            g.y = baseY + (1 - g.scale.y) * gridHeight * pixelSize;
        };
        Ticker.shared.add(animate);
    }

    /**
     * Jiggle effect — horizontal scale oscillation (for slime-like monsters).
     */
    public static jiggle(
        g: Graphics,
        pixelSize: number,
        gridHeight: number,
        baseY: number,
        speed: number = 2
    ): void {
        const animate = () => {
            if (g.destroyed) { Ticker.shared.remove(animate); return; }
            const time = Date.now() / 1000;
            g.scale.x = 1 + Math.sin(time * speed) * 0.04;
            g.scale.y = 1 - Math.sin(time * speed) * 0.03;
            g.y = baseY + (1 - g.scale.y) * gridHeight * pixelSize;
        };
        Ticker.shared.add(animate);
    }

    /**
     * Weapon glow — pulsing glow points on a sprite.
     * @param g Parent Graphics sprite
     * @param pixelSize Pixel size
     * @param points Array of glow points (grid coordinates + color + alpha)
     * @param speed Pulse speed in ms (lower = faster)
     */
    public static weaponGlow(
        g: Graphics,
        pixelSize: number,
        points: GlowPoint[],
        speed: number = 150
    ): Graphics {
        const glow = new Graphics();
        for (const p of points) {
            glow.rect(p.x * pixelSize, p.y * pixelSize, pixelSize, pixelSize)
                .fill({ color: p.color, alpha: p.alpha });
        }
        g.addChild(glow);

        const animate = () => {
            if (glow.destroyed) { Ticker.shared.remove(animate); return; }
            glow.alpha = 0.7 + Math.sin(Date.now() / speed) * 0.3;
        };
        Ticker.shared.add(animate);
        return glow;
    }

    /**
     * Pulsing ring aura (like shield or aura effects).
     */
    public static pulsingAura(
        g: Graphics,
        radius: number,
        color: number,
        speed: number = 300
    ): Graphics {
        const aura = new Graphics();
        aura.circle(g.width / 2, g.height / 2, radius)
            .stroke({ width: 3, color, alpha: 0.6 });
        g.addChild(aura);

        const animate = () => {
            if (aura.destroyed) { Ticker.shared.remove(animate); return; }
            aura.alpha = 0.4 + Math.sin(Date.now() / speed) * 0.3;
        };
        Ticker.shared.add(animate);
        return aura;
    }

    /**
     * Pulsing core effect — concentric circles that expand/contract.
     */
    public static pulsingCore(
        parent: Graphics,
        centerX: number,
        centerY: number,
        pixelSize: number,
        accentColor: number,
        coreColor: number
    ): Graphics {
        const core = new Graphics();
        parent.addChild(core);

        const animate = () => {
            if (core.destroyed) { Ticker.shared.remove(animate); return; }
            core.clear();
            const time = Date.now() / 1000;
            const pulse = 1 + Math.sin(time * 3) * 0.2;
            for (let i = 3; i >= 0; i--) {
                core.circle(centerX, centerY, (1 + i) * pixelSize * pulse)
                    .fill({ color: accentColor, alpha: 0.3 * (1 - i / 3) * pulse });
            }
            core.rect(centerX - pixelSize / 2, centerY - pixelSize / 2, pixelSize, pixelSize)
                .fill({ color: coreColor, alpha: 0.8 });
            core.rect(centerX - pixelSize / 2, centerY - pixelSize / 2, pixelSize, pixelSize)
                .fill({ color: accentColor, alpha: 0.9 });
        };
        Ticker.shared.add(animate);
        return core;
    }
}
