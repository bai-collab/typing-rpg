import type { PlayerState } from '../PlayerState';
import { SHOP_ITEMS, type ShopItem } from './ShopData';

export class ShopSystem {
    /**
     * Check if the player can afford the item.
     */
    public static canAfford(item: ShopItem, state: PlayerState): boolean {
        return state.gold >= item.price;
    }

    /**
     * Get how many of this item the player has purchased.
     */
    public static getOwnedCount(itemId: string, state: PlayerState): number {
        if (this.isConsumable(itemId)) {
            return state.consumables.filter(id => id === itemId).length;
        }
        return state.shopPurchases[itemId] || 0;
    }

    /**
     * Check if the item has reached its max stack.
     */
    public static isMaxed(item: ShopItem, state: PlayerState): boolean {
        if (item.maxStack === 0) return false; // unlimited
        return this.getOwnedCount(item.id, state) >= item.maxStack;
    }

    /**
     * Purchase an item. Returns true on success.
     */
    public static purchase(item: ShopItem, state: PlayerState): boolean {
        if (!this.canAfford(item, state)) return false;
        if (this.isMaxed(item, state)) return false;

        state.gold -= item.price;

        if (item.category === 'consumable') {
            state.consumables.push(item.id);
        } else {
            state.shopPurchases[item.id] = (state.shopPurchases[item.id] || 0) + 1;
        }

        return true;
    }

    /**
     * Get items by category.
     */
    public static getByCategory(category: ShopItem['category']): ShopItem[] {
        return SHOP_ITEMS.filter(i => i.category === category);
    }

    private static isConsumable(itemId: string): boolean {
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        return item?.category === 'consumable';
    }
}
