import type { ItemRarity } from './types';
import type { PlayerState } from '../PlayerState';

// ─────────────────────────────
//  Refinement Constants
// ─────────────────────────────

const REFINE_TABLE = [
    { cost: 100, rate: 0.90 },  // +0 → +1
    { cost: 200, rate: 0.80 },  // +1 → +2
    { cost: 400, rate: 0.65 },  // +2 → +3
    { cost: 800, rate: 0.50 },  // +3 → +4
    { cost: 1500, rate: 0.35 },  // +4 → +5
    { cost: 3000, rate: 0.20 },  // +5 → +6
];

const MAX_ENHANCE_LEVEL = 7;

const MULTIPLIERS = [1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.3, 2.6];

// ─────────────────────────────
//  Refine System
// ─────────────────────────────

export class RefineSystem {
    /**
     * Get the cost to upgrade from the current level.
     */
    public static getUpgradeCost(currentLevel: number): number {
        if (currentLevel >= MAX_ENHANCE_LEVEL - 1) return Infinity;
        return REFINE_TABLE[currentLevel]?.cost ?? Infinity;
    }

    /**
     * Get the success rate for upgrading from the current level.
     * SSR items get +5% bonus.
     */
    public static getSuccessRate(currentLevel: number, rarity: ItemRarity): number {
        if (currentLevel >= MAX_ENHANCE_LEVEL - 1) return 0;
        const base = REFINE_TABLE[currentLevel]?.rate ?? 0;
        const bonus = rarity === 'SSR' ? 0.05 : 0;
        return Math.min(1.0, base + bonus);
    }

    /**
     * Get the buff multiplier for a given enhance level.
     */
    public static getEnhancedMultiplier(level: number): number {
        return MULTIPLIERS[Math.min(level, MAX_ENHANCE_LEVEL)] ?? 1.0;
    }

    /**
     * Attempt to refine an item. Returns result.
     * Failure does NOT decrease level, only consumes gold.
     */
    public static attemptRefine(
        itemId: string,
        rarity: ItemRarity,
        state: PlayerState
    ): { success: boolean; newLevel: number; cost: number } {
        const currentLevel = state.enhanceLevels[itemId] || 0;
        const cost = this.getUpgradeCost(currentLevel);
        const rate = this.getSuccessRate(currentLevel, rarity);

        if (cost === Infinity || state.gold < cost) {
            return { success: false, newLevel: currentLevel, cost: 0 };
        }

        // Deduct gold
        state.gold -= cost;

        // Roll
        const roll = Math.random();
        if (roll < rate) {
            const newLevel = currentLevel + 1;
            state.enhanceLevels[itemId] = newLevel;
            return { success: true, newLevel, cost };
        }

        return { success: false, newLevel: currentLevel, cost };
    }

    /**
     * Get max enhance level constant.
     */
    public static get maxLevel(): number {
        return MAX_ENHANCE_LEVEL;
    }
}
