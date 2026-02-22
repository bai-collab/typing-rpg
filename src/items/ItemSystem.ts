import type { Item, ItemRarity, IPlayerState } from "./types";
import { ITEMS } from "./data";

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

    public static applyItem(item: Item, playerState: IPlayerState) {
        // Enforce max stack of 10
        const currentCount = playerState.itemStacks[item.id] || 0;
        if (currentCount >= 10) return;

        playerState.itemStacks[item.id] = currentCount + 1;
        playerState.inventory.push(item.id);
        item.applyBuff(playerState);
    }
}
export { ITEMS };
