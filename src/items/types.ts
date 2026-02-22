export type ItemRarity = 'R' | 'SR' | 'SSR';
export type ItemType = 'Attack' | 'Defense' | 'HP' | 'Heal' | 'Time' | 'Combo' | 'Charm';

export interface IPlayerState {
    attackMultiplier: number;
    defenseMultiplier: number;
    hpMultiplier: number;
    healMultiplier: number;
    timeAddition: number;
    critChance: number;
    reflectDamageRatio: number;
    hasCritShield: boolean;
    autoHealRate: number;
    perfectTimeBonus: number;
    comboDamageBonusR: number;
    combo3DamageMultiplier: number;
    combo5DamageMultiplier: number;
    reviveCount: number;
    reviveHpRatio: number;
    itemStacks: Record<string, number>;
}

export interface Item {
    id: string;
    type: ItemType;
    rarity: ItemRarity;
    name: string;
    description: string;
    applyBuff(state: IPlayerState): void;
}
