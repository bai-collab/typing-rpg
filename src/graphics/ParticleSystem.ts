/**
 * ParticleSystem — Lightweight burst particle engine.
 *
 * Creates small colored rectangles that fly outward from a point
 * and fade over time. Used for hit effects, death explosions,
 * combo sparks, etc.
 *
 * Usage:
 *   const ps = new ParticleSystem(container);
 *   ps.burst(x, y, 0xff0000, 20);
 *   // In your update loop:
 *   ps.update(delta);
 */

import { Graphics, Container } from 'pixi.js';

export interface Particle {
    graphics: Graphics;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
}

export class ParticleSystem {
    private particles: Particle[] = [];
    private container: Container;

    constructor(container: Container) {
        this.container = container;
    }

    /**
     * Spawn particles bursting outward from (x, y).
     * @param x Center X
     * @param y Center Y
     * @param color Fill color
     * @param count Number of particles
     * @param size Particle size (default 4)
     */
    public burst(x: number, y: number, color: number, count: number, size: number = 4): void {
        for (let i = 0; i < count; i++) {
            const p = new Graphics();
            p.rect(0, 0, size, size).fill({ color });
            p.x = x;
            p.y = y;
            this.container.addChild(p);

            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.particles.push({
                graphics: p,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                maxLife: Math.random() * 0.5 + 0.5,
            });
        }
    }

    /**
     * Spawn a directional particle stream (e.g., for trails).
     */
    public emit(
        x: number,
        y: number,
        color: number,
        count: number,
        directionAngle: number,
        spread: number = 0.5,
        speed: number = 4
    ): void {
        for (let i = 0; i < count; i++) {
            const p = new Graphics();
            p.rect(0, 0, 3, 3).fill({ color });
            p.x = x;
            p.y = y;
            this.container.addChild(p);

            const angle = directionAngle + (Math.random() - 0.5) * spread;
            const spd = speed * (Math.random() * 0.5 + 0.75);
            this.particles.push({
                graphics: p,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                life: 1.0,
                maxLife: Math.random() * 0.3 + 0.3,
            });
        }
    }

    /**
     * Update all particles. Call once per frame.
     * @param delta Frame delta (from Ticker)
     */
    public update(delta: number): void {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.graphics.x += p.vx * delta;
            p.graphics.y += p.vy * delta;
            p.life -= delta / 60;
            p.graphics.alpha = Math.max(0, p.life / p.maxLife);

            if (p.life <= 0) {
                this.container.removeChild(p.graphics);
                p.graphics.destroy();
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Destroy all particles immediately.
     */
    public clear(): void {
        for (const p of this.particles) {
            this.container.removeChild(p.graphics);
            p.graphics.destroy();
        }
        this.particles = [];
    }

    /** Current active particle count. */
    public get count(): number {
        return this.particles.length;
    }
}
