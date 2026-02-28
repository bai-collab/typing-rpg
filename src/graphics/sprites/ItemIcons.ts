/**
 * ItemIcons — 8×8 pixel art icons for all game items.
 *
 * Battle items: grouped by type (Attack, Defense, HP, Heal, Time, Combo, Charm).
 * Rarity is shown via a color tint overlay, not separate grids.
 *
 * Shop items: individual icons for each shop item.
 */

import type { PixelGrid, ColorPalette } from '../PixelRenderer';

export interface ItemIconData {
    id: string;
    art: PixelGrid;
    colors: ColorPalette;
}

// ────────────────────────────────────
//  Battle Item Icons (by type, 8×8)
// ────────────────────────────────────

// ⚔️ Attack — Sword
const ICON_ATK: ItemIconData = {
    id: 'atk',
    colors: [0x000000, 0xaaaaaa, 0xdddddd, 0xffffff, 0x884422, 0xaa6633, 0xff4444, 0xcc0000],
    art: [
        [0, 0, 0, 0, 0, 0, 3, 0],
        [0, 0, 0, 0, 0, 3, 2, 0],
        [0, 0, 0, 0, 3, 2, 1, 0],
        [0, 0, 0, 3, 2, 1, 0, 0],
        [0, 6, 3, 2, 1, 0, 0, 0],
        [0, 6, 5, 3, 0, 0, 0, 0],
        [0, 0, 6, 5, 0, 0, 0, 0],
        [0, 0, 0, 4, 0, 0, 0, 0],
    ],
};

// 🛡️ Defense — Shield
const ICON_DEF: ItemIconData = {
    id: 'def',
    colors: [0x000000, 0x3355aa, 0x4477cc, 0x5599ee, 0xffcc00, 0xffffff, 0x223366, 0x88aadd],
    art: [
        [0, 0, 1, 1, 1, 1, 0, 0],
        [0, 1, 2, 3, 3, 2, 1, 0],
        [1, 2, 3, 4, 4, 3, 2, 1],
        [1, 2, 3, 4, 4, 3, 2, 1],
        [1, 2, 3, 3, 3, 3, 2, 1],
        [0, 1, 2, 3, 3, 2, 1, 0],
        [0, 0, 1, 2, 2, 1, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
    ],
};

// ❤️ HP — Heart
const ICON_HP: ItemIconData = {
    id: 'hp',
    colors: [0x000000, 0xcc0000, 0xff2222, 0xff5555, 0xff8888, 0xffaaaa, 0x880000, 0xffffff],
    art: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 2, 0, 0, 1, 2, 0],
        [1, 2, 3, 2, 1, 2, 3, 2],
        [1, 3, 4, 3, 3, 4, 3, 2],
        [1, 3, 4, 4, 4, 3, 2, 1],
        [0, 1, 3, 4, 3, 2, 1, 0],
        [0, 0, 1, 3, 2, 1, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
    ],
};

// 💊 Heal — Potion
const ICON_HEAL: ItemIconData = {
    id: 'heal',
    colors: [0x000000, 0x44aa44, 0x66cc66, 0x88ee88, 0xaaffaa, 0xffffff, 0x228822, 0xdddddd],
    art: [
        [0, 0, 0, 7, 7, 0, 0, 0],
        [0, 0, 7, 5, 5, 7, 0, 0],
        [0, 0, 0, 7, 7, 0, 0, 0],
        [0, 0, 1, 6, 6, 1, 0, 0],
        [0, 1, 2, 2, 2, 2, 1, 0],
        [0, 1, 2, 3, 3, 2, 1, 0],
        [0, 1, 2, 3, 4, 2, 1, 0],
        [0, 0, 1, 1, 1, 1, 0, 0],
    ],
};

// ⏱️ Time — Hourglass
const ICON_TIME: ItemIconData = {
    id: 'time',
    colors: [0x000000, 0xaa8833, 0xddaa44, 0xffcc55, 0xffee88, 0xffffff, 0x886622, 0xeedd77],
    art: [
        [0, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 2, 3, 3, 2, 0, 0],
        [0, 0, 0, 3, 3, 0, 0, 0],
        [0, 0, 0, 4, 4, 0, 0, 0],
        [0, 0, 0, 3, 3, 0, 0, 0],
        [0, 0, 3, 7, 7, 3, 0, 0],
        [0, 0, 3, 3, 3, 3, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 0],
    ],
};

// 🔥 Combo — Flame
const ICON_COMBO: ItemIconData = {
    id: 'combo',
    colors: [0x000000, 0xcc3300, 0xff4400, 0xff6600, 0xff8800, 0xffaa00, 0xffcc00, 0xffee44],
    art: [
        [0, 0, 0, 0, 3, 0, 0, 0],
        [0, 0, 0, 3, 4, 0, 0, 0],
        [0, 0, 2, 3, 5, 3, 0, 0],
        [0, 2, 3, 5, 6, 3, 0, 0],
        [0, 2, 3, 6, 7, 5, 3, 0],
        [0, 1, 3, 5, 7, 5, 3, 0],
        [0, 1, 2, 3, 5, 3, 1, 0],
        [0, 0, 1, 1, 1, 1, 0, 0],
    ],
};

// 🔮 Charm — Crystal
const ICON_CHARM: ItemIconData = {
    id: 'charm',
    colors: [0x000000, 0x6633aa, 0x8855cc, 0xaa77ee, 0xcc99ff, 0xeeccff, 0xffffff, 0x442277],
    art: [
        [0, 0, 0, 6, 6, 0, 0, 0],
        [0, 0, 6, 5, 5, 6, 0, 0],
        [0, 6, 4, 5, 5, 4, 6, 0],
        [0, 1, 3, 4, 4, 3, 1, 0],
        [0, 1, 2, 3, 3, 2, 1, 0],
        [0, 0, 1, 2, 2, 1, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 7, 7, 7, 7, 0, 0],
    ],
};

// ────────────────────────────────────
//  Shop Item Icons (8×8)
// ────────────────────────────────────

// 🧪 HP Potion — Red Potion
const ICON_SHOP_POTION_HP: ItemIconData = {
    id: 'shop_potion_hp',
    colors: [0x000000, 0xcc0022, 0xff2244, 0xff5566, 0xff8899, 0xffffff, 0x880011, 0xdddddd],
    art: [
        [0, 0, 0, 7, 7, 0, 0, 0],
        [0, 0, 7, 5, 5, 7, 0, 0],
        [0, 0, 0, 7, 7, 0, 0, 0],
        [0, 0, 1, 6, 6, 1, 0, 0],
        [0, 1, 2, 2, 2, 2, 1, 0],
        [0, 1, 2, 3, 3, 2, 1, 0],
        [0, 1, 2, 3, 4, 2, 1, 0],
        [0, 0, 1, 1, 1, 1, 0, 0],
    ],
};

// 🧪 ATK Potion — Orange Potion
const ICON_SHOP_POTION_ATK: ItemIconData = {
    id: 'shop_potion_atk',
    colors: [0x000000, 0xcc6600, 0xff8800, 0xffaa33, 0xffcc66, 0xffffff, 0x884400, 0xdddddd],
    art: [
        [0, 0, 0, 7, 7, 0, 0, 0],
        [0, 0, 7, 5, 5, 7, 0, 0],
        [0, 0, 0, 7, 7, 0, 0, 0],
        [0, 0, 1, 6, 6, 1, 0, 0],
        [0, 1, 2, 2, 2, 2, 1, 0],
        [0, 1, 2, 3, 3, 2, 1, 0],
        [0, 1, 2, 3, 4, 2, 1, 0],
        [0, 0, 1, 1, 1, 1, 0, 0],
    ],
};

// 🧪 DEF Potion — Blue Potion
const ICON_SHOP_POTION_DEF: ItemIconData = {
    id: 'shop_potion_def',
    colors: [0x000000, 0x2244aa, 0x3366cc, 0x5588ee, 0x88aaff, 0xffffff, 0x113388, 0xdddddd],
    art: [
        [0, 0, 0, 7, 7, 0, 0, 0],
        [0, 0, 7, 5, 5, 7, 0, 0],
        [0, 0, 0, 7, 7, 0, 0, 0],
        [0, 0, 1, 6, 6, 1, 0, 0],
        [0, 1, 2, 2, 2, 2, 1, 0],
        [0, 1, 2, 3, 3, 2, 1, 0],
        [0, 1, 2, 3, 4, 2, 1, 0],
        [0, 0, 1, 1, 1, 1, 0, 0],
    ],
};

// ⏱️ Time Potion — Cyan Potion
const ICON_SHOP_POTION_TIME: ItemIconData = {
    id: 'shop_potion_time',
    colors: [0x000000, 0x008888, 0x00aaaa, 0x00cccc, 0x44eeee, 0xffffff, 0x006666, 0xdddddd],
    art: [
        [0, 0, 0, 7, 7, 0, 0, 0],
        [0, 0, 7, 5, 5, 7, 0, 0],
        [0, 0, 0, 7, 7, 0, 0, 0],
        [0, 0, 1, 6, 6, 1, 0, 0],
        [0, 1, 2, 2, 2, 2, 1, 0],
        [0, 1, 2, 3, 3, 2, 1, 0],
        [0, 1, 2, 3, 4, 2, 1, 0],
        [0, 0, 1, 1, 1, 1, 0, 0],
    ],
};

// 💎 Revive Stone
const ICON_SHOP_REVIVE: ItemIconData = {
    id: 'shop_revive',
    colors: [0x000000, 0x4488ff, 0x66aaff, 0x88ccff, 0xaaeeff, 0xffffff, 0x2266dd, 0xccddff],
    art: [
        [0, 0, 0, 5, 5, 0, 0, 0],
        [0, 0, 5, 4, 4, 5, 0, 0],
        [0, 5, 3, 4, 4, 3, 5, 0],
        [5, 2, 3, 4, 4, 3, 2, 5],
        [0, 1, 2, 3, 3, 2, 1, 0],
        [0, 0, 1, 2, 2, 1, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ],
};

// 🪙 Gold Boost
const ICON_SHOP_GOLD_BOOST: ItemIconData = {
    id: 'shop_gold_boost',
    colors: [0x000000, 0xaa7700, 0xcc9900, 0xffcc00, 0xffdd44, 0xffee88, 0xffffff, 0x886600],
    art: [
        [0, 0, 1, 1, 1, 1, 0, 0],
        [0, 1, 2, 3, 3, 2, 1, 0],
        [1, 2, 3, 4, 4, 3, 2, 1],
        [1, 3, 4, 5, 5, 4, 3, 1],
        [1, 3, 4, 5, 5, 4, 3, 1],
        [1, 2, 3, 4, 4, 3, 2, 1],
        [0, 1, 2, 3, 3, 2, 1, 0],
        [0, 0, 1, 1, 1, 1, 0, 0],
    ],
};

// 📖 XP Boost — Book
const ICON_SHOP_XP_BOOST: ItemIconData = {
    id: 'shop_xp_boost',
    colors: [0x000000, 0x442200, 0x664422, 0x886644, 0xccaa88, 0xffeedd, 0xffffff, 0xffcc00],
    art: [
        [0, 1, 1, 1, 1, 1, 0, 0],
        [1, 2, 5, 5, 5, 5, 1, 0],
        [1, 3, 5, 7, 5, 5, 1, 0],
        [1, 3, 5, 5, 7, 5, 1, 0],
        [1, 3, 5, 5, 5, 5, 1, 0],
        [1, 2, 5, 5, 5, 5, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ],
};

// 🍀 Lucky Clover
const ICON_SHOP_LUCKY: ItemIconData = {
    id: 'shop_lucky',
    colors: [0x000000, 0x226622, 0x44aa44, 0x66cc66, 0x88ee88, 0xaaffaa, 0x115511, 0x553311],
    art: [
        [0, 0, 2, 3, 3, 2, 0, 0],
        [0, 2, 3, 4, 4, 3, 2, 0],
        [2, 3, 4, 5, 5, 4, 3, 2],
        [0, 2, 3, 4, 4, 3, 2, 0],
        [2, 3, 4, 3, 3, 4, 3, 2],
        [0, 2, 3, 4, 4, 3, 2, 0],
        [0, 0, 0, 7, 7, 0, 0, 0],
        [0, 0, 0, 0, 7, 0, 0, 0],
    ],
};

// 🔥 Flame Aura
const ICON_SHOP_SKIN_FLAME: ItemIconData = {
    id: 'shop_skin_flame',
    colors: [0x000000, 0xcc2200, 0xff4400, 0xff6600, 0xff8800, 0xffaa00, 0xffcc00, 0xffee44],
    art: [
        [0, 0, 5, 0, 0, 5, 0, 0],
        [0, 4, 6, 4, 4, 6, 4, 0],
        [3, 5, 7, 5, 5, 7, 5, 3],
        [2, 4, 6, 4, 4, 6, 4, 2],
        [1, 3, 5, 3, 3, 5, 3, 1],
        [0, 2, 4, 2, 2, 4, 2, 0],
        [0, 1, 3, 1, 1, 3, 1, 0],
        [0, 0, 1, 0, 0, 1, 0, 0],
    ],
};

// ❄️ Ice Aura
const ICON_SHOP_SKIN_ICE: ItemIconData = {
    id: 'shop_skin_ice',
    colors: [0x000000, 0x224466, 0x4488aa, 0x66aacc, 0x88ccee, 0xaaeeff, 0xccffff, 0xffffff],
    art: [
        [0, 0, 0, 7, 7, 0, 0, 0],
        [0, 0, 5, 6, 6, 5, 0, 0],
        [0, 5, 0, 5, 5, 0, 5, 0],
        [7, 6, 5, 4, 4, 5, 6, 7],
        [7, 6, 5, 4, 4, 5, 6, 7],
        [0, 5, 0, 5, 5, 0, 5, 0],
        [0, 0, 5, 6, 6, 5, 0, 0],
        [0, 0, 0, 7, 7, 0, 0, 0],
    ],
};

// ── Permanent stat icons (reuse battle icons with shop prefix) ──
const ICON_SHOP_ATK_PERM = { ...ICON_ATK, id: 'shop_atk_perm' };
const ICON_SHOP_DEF_PERM = { ...ICON_DEF, id: 'shop_def_perm' };
const ICON_SHOP_HP_PERM = { ...ICON_HP, id: 'shop_hp_perm' };
const ICON_SHOP_CRIT_PERM: ItemIconData = {
    id: 'shop_crit_perm',
    colors: [0x000000, 0xcc6600, 0xff8800, 0xffaa33, 0xffcc66, 0xffffff, 0x884400, 0xff4444],
    art: [
        [0, 0, 0, 0, 0, 7, 0, 0],
        [0, 0, 0, 0, 7, 0, 0, 0],
        [0, 0, 0, 7, 7, 0, 0, 0],
        [0, 0, 7, 3, 3, 7, 0, 0],
        [0, 7, 3, 4, 4, 3, 7, 0],
        [7, 3, 4, 5, 5, 4, 3, 7],
        [0, 0, 3, 4, 4, 3, 0, 0],
        [0, 0, 0, 3, 3, 0, 0, 0],
    ],
};
const ICON_SHOP_TIME_PERM = { ...ICON_TIME, id: 'shop_time_perm' };

// ────────────────────────────────────
//  Exports
// ────────────────────────────────────

/** Battle item icons, keyed by item type. */
export const BATTLE_ITEM_ICONS: Record<string, ItemIconData> = {
    Attack: ICON_ATK,
    Defense: ICON_DEF,
    HP: ICON_HP,
    Heal: ICON_HEAL,
    Time: ICON_TIME,
    Combo: ICON_COMBO,
    Charm: ICON_CHARM,
};

/** Shop item icons, keyed by shop item id. */
export const SHOP_ITEM_ICONS: Record<string, ItemIconData> = {
    shop_atk_perm: ICON_SHOP_ATK_PERM,
    shop_def_perm: ICON_SHOP_DEF_PERM,
    shop_hp_perm: ICON_SHOP_HP_PERM,
    shop_crit_perm: ICON_SHOP_CRIT_PERM,
    shop_time_perm: ICON_SHOP_TIME_PERM,
    shop_potion_hp: ICON_SHOP_POTION_HP,
    shop_potion_atk: ICON_SHOP_POTION_ATK,
    shop_potion_def: ICON_SHOP_POTION_DEF,
    shop_potion_time: ICON_SHOP_POTION_TIME,
    shop_revive: ICON_SHOP_REVIVE,
    shop_gold_boost: ICON_SHOP_GOLD_BOOST,
    shop_xp_boost: ICON_SHOP_XP_BOOST,
    shop_lucky: ICON_SHOP_LUCKY,
    shop_skin_flame: ICON_SHOP_SKIN_FLAME,
    shop_skin_ice: ICON_SHOP_SKIN_ICE,
};

/** Get icon for a battle item by its type string. */
export function getBattleItemIcon(type: string): ItemIconData | undefined {
    return BATTLE_ITEM_ICONS[type];
}

/** Get icon for a shop item by its id string. */
export function getShopItemIcon(id: string): ItemIconData | undefined {
    return SHOP_ITEM_ICONS[id];
}
