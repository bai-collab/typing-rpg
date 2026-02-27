import type { IPlayerState } from "./items/types";
import { ItemSystem, ITEMS } from "./items/ItemSystem";
import { AchievementSystem, ACHIEVEMENTS } from "./utils/AchievementSystem";
import type { HeroType } from "./heroes/HeroFactory";

export class PlayerState implements IPlayerState {
    public hpBase: number = 120;
    public score: number = 0;
    public highestCombo: number = 0;
    // Accumulators for buffs (Max 10 stacks per item applied later)
    public attackMultiplier: number = 1.0;
    public defenseMultiplier: number = 1.0;
    public hpMultiplier: number = 1.0;
    public healMultiplier: number = 1.0;
    public timeAddition: number = 0.0;
    public gold: number = 0;
    public heroType: HeroType = 'warrior';

    // Special Buffs
    public critChance: number = 0.0;
    public reflectDamageRatio: number = 0.0;
    public hasCritShield: boolean = false; // SSR defense: low hp shield (one time per combat?)
    public autoHealRate: number = 0.0; // Heal SSR
    public perfectTimeBonus: number = 0.0; // Time SSR

    // Combo
    public comboDamageBonusR: number = 0; // +5% global? or just flat
    public combo3DamageMultiplier: number = 1.0;
    public combo5DamageMultiplier: number = 1.0;

    // Resurrect
    public reviveCount: number = 0;
    public reviveHpRatio: number = 0.5; // 0.5, 0.8, 1.0

    // Achievement Cosmetics
    public characterTint: number = 0x00aaff; // Default Blue
    public errorWordStats: Record<string, number> = {};

    // Shop System
    public shopPurchases: Record<string, number> = {};
    public consumables: string[] = [];
    public goldBoostPerm: number = 0;
    public scoreBoostPerm: number = 0;
    public ssrDropBoost: number = 0;
    public cosmetics: string[] = [];
    public enhanceLevels: Record<string, number> = {};

    // Getters for Achievement Buffs (Passive)
    public get achievementAtkBonus(): number {
        const stats = AchievementSystem.loadStats();
        let bonus = stats.unlockedAchievements[ACHIEVEMENTS.COMBO_MASTER] ? 0.05 : 0;
        if (stats.unlockedAchievements[ACHIEVEMENTS.WORD_MASTER]) bonus += 0.10;
        if (stats.unlockedAchievements[ACHIEVEMENTS.COLLECTOR_SR]) bonus += 0.05; // Note: implemented as flat in desc, but using multiplier here for simplicity or could be flat
        return bonus;
    }

    public get achievementHpBonus(): number {
        const stats = AchievementSystem.loadStats();
        let bonus = stats.unlockedAchievements[ACHIEVEMENTS.IMMORTAL] ? 0.2 : 0;
        if (stats.unlockedAchievements[ACHIEVEMENTS.WARRIOR_NO_DAMAGE]) bonus += 0.05;
        return bonus;
    }

    public get achievementScoreBonus(): number {
        const stats = AchievementSystem.loadStats();
        return stats.unlockedAchievements[ACHIEVEMENTS.SCHOLAR] ? 0.1 : 0;
    }

    public get achievementCritBonus(): number {
        const stats = AchievementSystem.loadStats();
        let bonus = stats.unlockedAchievements[ACHIEVEMENTS.COLLECTOR_SSR] ? 0.10 : 0;
        if (stats.unlockedAchievements[ACHIEVEMENTS.CRIT_EXPERT]) bonus += 0.05;
        return bonus;
    }

    public get achievementTimeBonus(): number {
        const stats = AchievementSystem.loadStats();
        return stats.unlockedAchievements[ACHIEVEMENTS.SPEED_KING] ? 1.0 : 0;
    }

    public get achievementGoldBonus(): number {
        const stats = AchievementSystem.loadStats();
        return stats.unlockedAchievements[ACHIEVEMENTS.ECONOMY_MASTER] ? 0.1 : 0;
    }

    // Inventory
    public inventory: string[] = [];

    // Keep track of counts
    public itemStacks: Record<string, number> = {};

    // Save System
    public saveToStorage(level: number, mode: string, currentHp: number, currentCombo: number) {
        const saveData = {
            level,
            mode,
            // hpBase is not defined in PlayerState, assuming it's meant to be passed or derived
            // For now, omitting hpBase from save, or assuming it's a constant
            currentHp,
            score: this.score,
            gold: this.gold,
            highestCombo: Math.max(this.highestCombo, currentCombo),
            inventory: this.inventory,
            heroType: this.heroType,
            characterTint: this.characterTint,
            errorWordStats: this.errorWordStats,
            shopPurchases: this.shopPurchases,
            consumables: this.consumables,
            goldBoostPerm: this.goldBoostPerm,
            scoreBoostPerm: this.scoreBoostPerm,
            ssrDropBoost: this.ssrDropBoost,
            cosmetics: this.cosmetics,
            enhanceLevels: this.enhanceLevels,
        };
        localStorage.setItem('typingRpgSaveData', JSON.stringify(saveData));
    }

    public static clearStorage() {
        localStorage.removeItem('typingRpgSaveData');
    }

    public loadFromStorage(): any | null {
        const raw = localStorage.getItem('typingRpgSaveData');
        if (!raw) return null;

        try {
            const data = JSON.parse(raw);
            this.hpBase = data.hpBase || 120;
            this.score = data.score || 0;
            this.gold = data.gold || 0;
            this.highestCombo = data.highestCombo || 0;
            this.inventory = data.inventory || [];
            this.heroType = data.heroType || 'warrior';
            if (data.characterTint !== undefined) {
                this.characterTint = data.characterTint;
            }
            this.errorWordStats = data.errorWordStats || {};
            this.shopPurchases = data.shopPurchases || {};
            this.consumables = data.consumables || [];
            this.goldBoostPerm = data.goldBoostPerm || 0;
            this.scoreBoostPerm = data.scoreBoostPerm || 0;
            this.ssrDropBoost = data.ssrDropBoost || 0;
            this.cosmetics = data.cosmetics || [];
            this.enhanceLevels = data.enhanceLevels || {};

            // Re-apply items to reconstruct stacks/multipliers
            this.applyInventory();

            return data;
        } catch (e) {
            console.error("Failed to parse save data", e);
            return null;
        }
    }

    public resetBuffs() {
        this.attackMultiplier = 1.0;
        this.defenseMultiplier = 1.0;
        this.hpMultiplier = 1.0;
        this.healMultiplier = 1.0;
        this.timeAddition = 0.0;
        this.critChance = 0.0;
        this.reflectDamageRatio = 0.0;
        this.hasCritShield = false;
        this.autoHealRate = 0.0;
        this.perfectTimeBonus = 0.0;
        this.comboDamageBonusR = 0;
        this.combo3DamageMultiplier = 1.0;
        this.combo5DamageMultiplier = 1.0;
        this.reviveCount = 0;
        this.reviveHpRatio = 0.5;
        // Note: gold is NOT reset here — it persists across game sessions
        this.itemStacks = {};
        // Note: we DON'T reset errorWordStats here as it's meant to be persistent across games
    }

    public applyInventory() {
        this.resetBuffs();

        const oldInventory = Object.assign([], this.inventory);
        this.inventory = [];

        for (const itemId of oldInventory) {
            const item = ITEMS.find(i => i.id === itemId);
            if (item) {
                ItemSystem.applyItem(item, this);
            }
        }
    }
}
