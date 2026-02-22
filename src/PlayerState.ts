export class PlayerState {
    public hpBase: number = 120;
    public score: number = 0;
    public highestCombo: number = 0;
    // Accumulators for buffs (Max 10 stacks per item applied later)
    public attackMultiplier: number = 1.0;
    public defenseMultiplier: number = 1.0;
    public hpMultiplier: number = 1.0;
    public healMultiplier: number = 1.0;
    public timeAddition: number = 0.0;

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
            highestCombo: Math.max(this.highestCombo, currentCombo),
            inventory: this.inventory
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
            this.highestCombo = data.highestCombo || 0;
            this.inventory = data.inventory || [];

            // Re-apply items to reconstruct stacks/multipliers
            this.itemStacks = {};
            this.inventory.forEach(itemId => {
                this.itemStacks[itemId] = (this.itemStacks[itemId] || 0) + 1;
            });
            // Note: The multipliers would typically be recalculated by whoever calls applyItems()

            return data;
        } catch (e) {
            console.error("Failed to parse save data", e);
            return null;
        }
    }

    public resetRound() {
        // Reset single-round flags like shield if needed
    }
}
