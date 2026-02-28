/**
 * VFXLibrary — Reusable visual effects for PixiJS.
 *
 * All effects are self-animating and auto-cleanup via Ticker.
 *
 * Available:
 * - shockwave: expanding ring
 * - crossLight: golden cross burst (paladin)
 * - projectile: moves from A to B with optional trail
 * - damageNumber: floating text that rises and fades
 * - slashArc: curved slash trail
 */

import { Graphics, Text, TextStyle, Container, Ticker } from 'pixi.js';

export class VFXLibrary {
    /**
     * Expanding circular shockwave.
     */
    public static shockwave(
        container: Container,
        x: number,
        y: number,
        color: number,
        maxRadius: number,
        durationMs: number = 500
    ): void {
        const wave = new Graphics();
        container.addChild(wave);
        const startTime = Date.now();

        const animate = () => {
            const progress = (Date.now() - startTime) / durationMs;
            if (progress >= 1 || wave.destroyed) {
                Ticker.shared.remove(animate);
                if (!wave.destroyed) wave.destroy();
                return;
            }
            wave.clear();
            const r = maxRadius * progress;
            wave.circle(x, y, r).stroke({ width: 3 * (1 - progress), color, alpha: 1 - progress });
        };
        Ticker.shared.add(animate);
    }

    /**
     * Cross-shaped light burst.
     */
    public static crossLight(
        container: Container,
        x: number,
        y: number,
        color: number = 0xffffff,
        durationMs: number = 600,
        maxLength: number = 40
    ): void {
        const cross = new Graphics();
        container.addChild(cross);
        const startTime = Date.now();

        const animate = () => {
            const progress = (Date.now() - startTime) / durationMs;
            if (progress >= 1 || cross.destroyed) {
                Ticker.shared.remove(animate);
                if (!cross.destroyed) cross.destroy();
                return;
            }
            cross.clear();
            const alpha = 1 - progress;
            const len = maxLength * progress;
            const w = 6 * (1 - progress);
            cross.rect(x - w / 2, y - len, w, len * 2).fill({ color, alpha });
            cross.rect(x - len, y - w / 2, len * 2, w).fill({ color, alpha });
        };
        Ticker.shared.add(animate);
    }

    /**
     * Projectile moving from start → end with optional trail.
     */
    public static projectile(
        container: Container,
        startX: number,
        startY: number,
        endX: number,
        endY: number,
        color: number,
        radius: number = 6,
        durationMs: number = 350,
        trail: boolean = true
    ): void {
        const proj = new Graphics();
        proj.circle(0, 0, radius).fill({ color, alpha: 0.9 });
        container.addChild(proj);
        proj.x = startX;
        proj.y = startY;
        const startTime = Date.now();

        const animate = () => {
            const progress = (Date.now() - startTime) / durationMs;
            if (progress >= 1 || proj.destroyed) {
                Ticker.shared.remove(animate);
                if (!proj.destroyed) proj.destroy();
                return;
            }
            proj.x = startX + (endX - startX) * progress;
            proj.y = startY + (endY - startY) * progress;
            proj.alpha = 1 - progress * 0.3;

            if (trail && Math.random() < 0.4) {
                const t = new Graphics();
                t.rect(0, 0, 3, 3).fill({ color, alpha: 0.7 });
                t.x = proj.x + (Math.random() - 0.5) * 8;
                t.y = proj.y + (Math.random() - 0.5) * 8;
                container.addChild(t);
                const ts = Date.now();
                const ta = () => {
                    const tp = (Date.now() - ts) / 300;
                    if (tp >= 1 || t.destroyed) { Ticker.shared.remove(ta); if (!t.destroyed) t.destroy(); return; }
                    t.alpha = 1 - tp;
                    t.y -= 1;
                };
                Ticker.shared.add(ta);
            }
        };
        Ticker.shared.add(animate);
    }

    /**
     * Arc projectile with parabolic trajectory.
     */
    public static arcProjectile(
        container: Container,
        startX: number,
        startY: number,
        endX: number,
        endY: number,
        color: number,
        arcHeight: number = 100,
        durationMs: number = 600,
        onImpact?: () => void
    ): void {
        const ball = new Graphics();
        ball.ellipse(0, 0, 10, 8).fill({ color }).stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
        container.addChild(ball);
        const startTime = Date.now();

        const animate = () => {
            const progress = (Date.now() - startTime) / durationMs;
            if (progress >= 1 || ball.destroyed) {
                Ticker.shared.remove(animate);
                if (!ball.destroyed) ball.destroy();
                onImpact?.();
                return;
            }
            const arc = Math.sin(progress * Math.PI) * arcHeight;
            ball.x = startX + (endX - startX) * progress;
            ball.y = startY + (endY - startY) * progress - arc;
            ball.rotation = progress * Math.PI * 4;
        };
        Ticker.shared.add(animate);
    }

    /**
     * Curved slash trail (sword attack).
     */
    public static slashArc(
        container: Container,
        heroX: number,
        heroY: number,
        targetX: number,
        targetY: number,
        color: number,
        lineWidth: number = 10,
        durationMs: number = 400
    ): void {
        const slash = new Graphics();
        container.addChild(slash);
        const startTime = Date.now();

        const animate = () => {
            const progress = (Date.now() - startTime) / durationMs;
            if (progress >= 1 || slash.destroyed) {
                Ticker.shared.remove(animate);
                if (!slash.destroyed) slash.destroy();
                return;
            }
            slash.clear();
            const alpha = 1 - progress;
            slash.moveTo(heroX, heroY)
                .quadraticCurveTo(heroX + (targetX - heroX) / 2, heroY - 60, targetX, targetY)
                .stroke({ width: lineWidth * (1 - progress), color, alpha });
        };
        Ticker.shared.add(animate);
    }

    /**
     * Floating damage/heal number.
     */
    public static damageNumber(
        container: Container,
        x: number,
        y: number,
        text: string | number,
        color: string = '#ff0000',
        fontSize: number = 32,
        durationMs: number = 1000
    ): void {
        const displayText = typeof text === 'number' && text > 0 ? `-${text}` : `${text}`;
        const dmg = new Text({
            text: displayText,
            style: new TextStyle({
                fontFamily: 'Courier New',
                fontSize,
                fill: color,
                fontWeight: 'bold',
                dropShadow: { color: 0x000000, alpha: 1, distance: 2 },
            }),
        });
        dmg.x = x;
        dmg.y = y;
        dmg.anchor.set(0.5);
        container.addChild(dmg);

        let elapsed = 0;
        const animate = () => {
            elapsed += Ticker.shared.deltaMS;
            dmg.y -= 2;
            dmg.alpha = 1 - elapsed / durationMs;

            if (elapsed > durationMs) {
                Ticker.shared.remove(animate);
                if (!dmg.destroyed) {
                    container.removeChild(dmg);
                    dmg.destroy();
                }
            }
        };
        Ticker.shared.add(animate);
    }
}
