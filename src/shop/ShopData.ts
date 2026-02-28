import type { PlayerState } from '../PlayerState';

export type ShopItemCategory = 'permanent' | 'consumable' | 'special';

export interface ShopItem {
    id: string;
    name: string;
    icon: string;
    category: ShopItemCategory;
    price: number;
    description: string;
    maxStack: number;       // 0 = unlimited
}

// ─────────────────────────────
//  永久加成道具
// ─────────────────────────────

export const SHOP_ITEMS: ShopItem[] = [
    // Permanent stat boosts
    { id: 'shop_atk_perm', name: '攻擊強化', icon: '⚔️', category: 'permanent', price: 200, description: '永久攻擊 +3%', maxStack: 10 },
    { id: 'shop_def_perm', name: '防禦強化', icon: '🛡️', category: 'permanent', price: 200, description: '永久防禦 +3%', maxStack: 10 },
    { id: 'shop_hp_perm', name: '體力強化', icon: '❤️', category: 'permanent', price: 250, description: '永久血量 +5%', maxStack: 10 },
    { id: 'shop_crit_perm', name: '暴擊強化', icon: '💥', category: 'permanent', price: 500, description: '永久暴擊率 +2%', maxStack: 5 },
    { id: 'shop_time_perm', name: '時間延長', icon: '⏱️', category: 'permanent', price: 300, description: '永久回合時間 +0.3s', maxStack: 5 },

    // Consumables (single-use per battle)
    { id: 'shop_potion_hp', name: '生命藥水', icon: '🧪', category: 'consumable', price: 50, description: '下場新遊戲開始時 +30% 最大血量', maxStack: 0 },
    { id: 'shop_potion_atk', name: '力量藥水', icon: '🧪', category: 'consumable', price: 80, description: '下場新遊戲時攻擊力 ×1.5', maxStack: 0 },
    { id: 'shop_potion_def', name: '鐵壁藥水', icon: '🧪', category: 'consumable', price: 80, description: '下場新遊戲時防禦力 ×1.5', maxStack: 0 },
    { id: 'shop_potion_time', name: '時光藥水', icon: '🧪', category: 'consumable', price: 60, description: '下場新遊戲時回合時間 +5 秒', maxStack: 0 },
    { id: 'shop_revive', name: '復活石', icon: '💎', category: 'consumable', price: 150, description: '下場新遊戲時額外復活 1 次', maxStack: 0 },

    // Special / Permanent unlocks
    { id: 'shop_gold_boost', name: '招財符', icon: '🪙', category: 'special', price: 300, description: '永久金幣獲取 +10%', maxStack: 3 },
    { id: 'shop_xp_boost', name: '經驗卷', icon: '📖', category: 'special', price: 300, description: '永久分數獲取 +10%', maxStack: 3 },
    { id: 'shop_lucky', name: '幸運草', icon: '🍀', category: 'special', price: 400, description: 'SSR 道具掉落率 +5%', maxStack: 3 },
    { id: 'shop_skin_flame', name: '火焰光環', icon: '🔥', category: 'special', price: 800, description: '角色特效：火焰粒子', maxStack: 1 },
    { id: 'shop_skin_ice', name: '冰霜光環', icon: '❄️', category: 'special', price: 800, description: '角色特效：冰霜粒子', maxStack: 1 },
];

// ─────────────────────────────
//  Apply permanent shop purchases on load
// ─────────────────────────────

export function applyShopPermanents(state: PlayerState): void {
    for (const [id, count] of Object.entries(state.shopPurchases)) {
        for (let i = 0; i < count; i++) {
            switch (id) {
                case 'shop_atk_perm': state.attackMultiplier += 0.03; break;
                case 'shop_def_perm': state.defenseMultiplier += 0.03; break;
                case 'shop_hp_perm': state.hpMultiplier += 0.05; break;
                case 'shop_crit_perm': state.critChance += 0.02; break;
                case 'shop_time_perm': state.timeAddition += 0.3; break;
                case 'shop_gold_boost': state.goldBoostPerm += 0.10; break;
                case 'shop_xp_boost': state.scoreBoostPerm += 0.10; break;
                case 'shop_lucky': state.ssrDropBoost += 0.05; break;
                case 'shop_skin_flame':
                    if (!state.cosmetics.includes('flame')) state.cosmetics.push('flame');
                    break;
                case 'shop_skin_ice':
                    if (!state.cosmetics.includes('ice')) state.cosmetics.push('ice');
                    break;
            }
        }
    }
}

// ─────────────────────────────
//  Apply consumables at battle start (then clear)
// ─────────────────────────────

export function applyConsumables(state: PlayerState): void {
    for (const id of state.consumables) {
        switch (id) {
            case 'shop_potion_hp': state.hpMultiplier += 0.30; break;
            case 'shop_potion_atk': state.attackMultiplier += 0.50; break;
            case 'shop_potion_def': state.defenseMultiplier += 0.50; break;
            case 'shop_potion_time': state.timeAddition += 5.0; break;
            case 'shop_revive': state.reviveCount += 1; break;
        }
    }
    state.consumables = [];
}
