import { PlayerState } from "../PlayerState";

export type ItemRarity = 'R' | 'SR' | 'SSR';
export type ItemType = 'Attack' | 'Defense' | 'HP' | 'Heal' | 'Time' | 'Combo' | 'Charm';

export interface Item {
    id: string;
    type: ItemType;
    rarity: ItemRarity;
    name: string;
    description: string;
    applyBuff(state: PlayerState): void;
}

export const ITEMS: Item[] = [
    // Attack
    { id: 'atk_r', type: 'Attack', rarity: 'R', name: '攻擊 R', description: '攻擊力 +5%', applyBuff: (s) => s.attackMultiplier += 0.05 },
    { id: 'atk_sr', type: 'Attack', rarity: 'SR', name: '攻擊 SR', description: '攻擊力 +15%', applyBuff: (s) => s.attackMultiplier += 0.15 },
    { id: 'atk_ssr', type: 'Attack', rarity: 'SSR', name: '攻擊 SSR', description: '攻擊力 +25%\n爆擊率 +10%', applyBuff: (s) => { s.attackMultiplier += 0.25; s.critChance += 0.1; } },

    // Defense
    { id: 'def_r', type: 'Defense', rarity: 'R', name: '防禦 R', description: '防禦力 +5%', applyBuff: (s) => s.defenseMultiplier += 0.05 },
    { id: 'def_sr', type: 'Defense', rarity: 'SR', name: '防禦 SR', description: '防禦力 +15%', applyBuff: (s) => s.defenseMultiplier += 0.15 },
    { id: 'def_ssr', type: 'Defense', rarity: 'SSR', name: '防禦 SSR', description: '防禦力 +25%\n反彈傷害 5%', applyBuff: (s) => { s.defenseMultiplier += 0.25; s.reflectDamageRatio += 0.05; } },

    // HP
    { id: 'hp_r', type: 'HP', rarity: 'R', name: '血量 R', description: '最大血量 +5%', applyBuff: (s) => s.hpMultiplier += 0.05 },
    { id: 'hp_sr', type: 'HP', rarity: 'SR', name: '血量 SR', description: '最大血量 +15%', applyBuff: (s) => s.hpMultiplier += 0.15 },
    { id: 'hp_ssr', type: 'HP', rarity: 'SSR', name: '血量 SSR', description: '最大血量 +25%\n瀕死護盾', applyBuff: (s) => { s.hpMultiplier += 0.25; s.hasCritShield = true; } },

    // Heal
    { id: 'heal_r', type: 'Heal', rarity: 'R', name: '補血 R', description: '補血量 +5%', applyBuff: (s) => s.healMultiplier += 0.05 },
    { id: 'heal_sr', type: 'Heal', rarity: 'SR', name: '補血 SR', description: '補血量 +15%', applyBuff: (s) => s.healMultiplier += 0.15 },
    { id: 'heal_ssr', type: 'Heal', rarity: 'SSR', name: '補血 SSR', description: '補血量 +25%\n每回合回血2%', applyBuff: (s) => { s.healMultiplier += 0.25; s.autoHealRate += 0.02; } },

    // Time
    { id: 'time_r', type: 'Time', rarity: 'R', name: '時間 R', description: '回合時間 +0.5秒', applyBuff: (s) => s.timeAddition += 0.5 },
    { id: 'time_sr', type: 'Time', rarity: 'SR', name: '時間 SR', description: '回合時間 +1秒', applyBuff: (s) => s.timeAddition += 1.0 },
    { id: 'time_ssr', type: 'Time', rarity: 'SSR', name: '時間 SSR', description: '回合時間 +2秒\n完美額外 +1秒', applyBuff: (s) => { s.timeAddition += 2.0; s.perfectTimeBonus += 1.0; } },

    // Combo
    { id: 'combo_r', type: 'Combo', rarity: 'R', name: '連擊 R', description: '連擊傷害 +5%', applyBuff: (s) => s.comboDamageBonusR += 0.05 },
    { id: 'combo_sr', type: 'Combo', rarity: 'SR', name: '連擊 SR', description: '連擊3次傷害 +20%', applyBuff: (s) => s.combo3DamageMultiplier += 0.20 },
    { id: 'combo_ssr', type: 'Combo', rarity: 'SSR', name: '連擊 SSR', description: '連擊5次傷害 +50%', applyBuff: (s) => s.combo5DamageMultiplier += 0.50 },

    // Charm (Revive)
    { id: 'charm_r', type: 'Charm', rarity: 'R', name: '護符 R', description: '復活1次 (恢復50%血量)', applyBuff: (s) => { s.reviveCount += 1; s.reviveHpRatio = Math.max(s.reviveHpRatio, 0.5); } },
    { id: 'charm_sr', type: 'Charm', rarity: 'SR', name: '護符 SR', description: '復活1次 (恢復80%血量)', applyBuff: (s) => { s.reviveCount += 1; s.reviveHpRatio = Math.max(s.reviveHpRatio, 0.8); } },
    { id: 'charm_ssr', type: 'Charm', rarity: 'SSR', name: '護符 SSR', description: '復活2次 (恢復100%血量)', applyBuff: (s) => { s.reviveCount += 2; s.reviveHpRatio = 1.0; } },
];

export class ItemSystem {
    public static generateChoices(): Item[] {
        const choices: Item[] = [];
        const availableItems = [...ITEMS];

        for (let i = 0; i < 3; i++) {
            const rarityRoll = Math.random();
            let targetRarity: ItemRarity = 'R'; // 60%
            if (rarityRoll > 0.6 && rarityRoll <= 0.9) targetRarity = 'SR'; // 30%
            else if (rarityRoll > 0.9) targetRarity = 'SSR'; // 10%

            // Filter available matching rarity
            let pool = availableItems.filter(item => item.rarity === targetRarity);

            // Fallback if we run out (shouldn't happen with our pool size, but safe)
            if (pool.length === 0) pool = availableItems;

            const selectedIdx = Math.floor(Math.random() * pool.length);
            const selectedItem = pool[selectedIdx];

            choices.push(selectedItem);

            // Remove exact item so we don't get duplicates in same 3 choices
            const globalIdx = availableItems.indexOf(selectedItem);
            if (globalIdx !== -1) availableItems.splice(globalIdx, 1);
        }

        return choices;
    }

    public static applyItem(item: Item, playerState: PlayerState) {
        // Enforce max stack of 10
        const currentCount = playerState.itemStacks[item.id] || 0;
        if (currentCount >= 10) return;

        playerState.itemStacks[item.id] = currentCount + 1;
        item.applyBuff(playerState);
    }
}
