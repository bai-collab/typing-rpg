import { Text, TextStyle, Graphics, Container } from 'pixi.js';
import { Scene } from './Scene';
import { ItemSystem, ITEMS } from '../items/ItemSystem';
import type { Item, ItemRarity } from '../items/types';
import { CloudSave } from '../utils/CloudSave';

export class ItemRewardScene extends Scene {
    private titleText!: Text;
    private hintText!: Text;
    private cardGraphics: Graphics[] = [];
    private cardTexts: Text[] = [];
    private itemsContainer!: Container;
    private choices: Item[] = [];
    private selectedIndex = 1; // Middle selected by default

    public enter() {
        this.container.removeChildren();

        // Generate Choices
        this.choices = ItemSystem.generateChoices();
        this.selectedIndex = 1;
        this.cardGraphics = [];
        this.cardTexts = [];

        // Draw acquired items
        this.itemsContainer = new Container();
        this.itemsContainer.x = 20;
        this.itemsContainer.y = 20;
        this.renderItems();
        this.container.addChild(this.itemsContainer);

        const titleStyle = new TextStyle({
            fontFamily: 'Courier New',
            fontSize: 40,
            fill: '#ffffff',
            dropShadow: { alpha: 0.5, color: '#000000', distance: 2 }
        });

        this.titleText = new Text({ text: '關卡突破！請選擇一項戰利品', style: titleStyle });
        this.titleText.anchor.set(0.5);
        this.titleText.x = this.game.app.screen.width / 2;
        this.titleText.y = this.game.app.screen.height * 0.133; // 80/600
        this.container.addChild(this.titleText);

        const hintStyle = new TextStyle({
            fontFamily: 'Courier New, "Microsoft JhengHei", sans-serif',
            fontSize: 20,
            fill: '#aaaaaa',
            wordWrap: true,
            wordWrapWidth: 600,
            align: 'center'
        });

        this.hintText = new Text({ text: '提示：後續的怪物會更強，攻擊力或保命手段都很重要！', style: hintStyle });
        this.hintText.anchor.set(0.5);
        this.hintText.x = this.game.app.screen.width / 2;
        this.hintText.y = this.game.app.screen.height * 0.833; // 500/600
        this.container.addChild(this.hintText);

        const cardWidth = 220;
        const cardHeight = 300;
        const gap = 30;
        const sw = this.game.app.screen.width;
        const sh = this.game.app.screen.height;
        const startX = sw / 2 - (cardWidth * 1.5) - gap;

        for (let i = 0; i < 3; i++) {
            const item = this.choices[i];
            const g = new Graphics();
            g.x = startX + i * (cardWidth + gap);
            g.y = sh * 0.25; // 150/600

            this.cardGraphics.push(g);
            this.container.addChild(g);

            const t = new Text({
                text: `${this.getRaritySymbol(item.rarity)}\n\n${item.name}\n\n${item.description}`,
                style: new TextStyle({
                    fontFamily: 'Courier New, "Microsoft JhengHei", sans-serif',
                    fontSize: 20,
                    fill: '#ffffff',
                    wordWrap: true,
                    wordWrapWidth: 200,
                    align: 'center',
                    lineHeight: 30
                })
            });
            t.anchor.set(0.5);
            t.x = g.x + cardWidth / 2;
            t.y = g.y + cardHeight / 2;
            this.cardTexts.push(t);
            this.container.addChild(t);
        }

        this.updateSelection();
        window.addEventListener('keydown', this.handleKeyDown);
    }

    private getRaritySymbol(r: ItemRarity) {
        if (r === 'SSR') return '★★★ SSR';
        if (r === 'SR') return '★★ SR';
        return '★ R';
    }

    private getCardColor(r: ItemRarity) {
        if (r === 'SSR') return 0xffaa00; // Gold
        if (r === 'SR') return 0x4488ff; // Blue
        return 0x888888; // Gray
    }

    private renderItems() {
        this.itemsContainer.removeChildren();
        const itemStacks = this.game.playerState.itemStacks;
        const keys = Object.keys(itemStacks);

        if (keys.length === 0) return;

        const titleText = new Text({
            text: '已持有戰利品:',
            style: new TextStyle({ fontFamily: 'Courier New, "Microsoft JhengHei", sans-serif', fontSize: 16, fill: '#aaaaaa' })
        });
        this.itemsContainer.addChild(titleText);

        let yOffset = 25;
        keys.forEach(id => {
            const count = itemStacks[id];
            const itemDef = ITEMS.find(i => i.id === id);
            if (!itemDef) return;

            let color = '#888888';
            if (itemDef.rarity === 'SR') color = '#4488ff';
            if (itemDef.rarity === 'SSR') color = '#ffaa00';

            let itemStr = `${itemDef.name} x${count}`;
            if (itemDef.type === 'Charm') {
                itemStr += ` (剩餘 ${this.game.playerState.reviveCount} 次)`;
            }

            const itemText = new Text({
                text: itemStr,
                style: new TextStyle({ fontFamily: 'Courier New, "Microsoft JhengHei", sans-serif', fontSize: 16, fill: color })
            });
            itemText.y = yOffset;
            this.itemsContainer.addChild(itemText);
            yOffset += 22;
        });
    }

    private updateSelection() {
        const cardWidth = 220;
        const cardHeight = 300;

        for (let i = 0; i < 3; i++) {
            const g = this.cardGraphics[i];
            const item = this.choices[i];
            const baseColor = this.getCardColor(item.rarity);

            g.clear();

            if (i === this.selectedIndex) {
                // Highlighted
                g.rect(0, 0, cardWidth, cardHeight).fill({ color: baseColor });
                g.rect(0, 0, cardWidth, cardHeight).stroke({ color: 0xffffff, width: 4 });

                // Float up slightly
                g.y = this.game.app.screen.height * 0.233; // 140/600
                this.cardTexts[i].y = g.y + cardHeight / 2;
            } else {
                // Dimmed
                g.rect(0, 0, cardWidth, cardHeight).fill({ color: 0x333333 });
                g.rect(0, 0, cardWidth, cardHeight).stroke({ color: baseColor, width: 2 });

                g.y = this.game.app.screen.height * 0.25; // 150/600
                this.cardTexts[i].y = g.y + cardHeight / 2;
            }
        }
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
            this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            this.updateSelection();
        } else if (e.key === 'ArrowRight') {
            this.selectedIndex = Math.min(2, this.selectedIndex + 1);
            this.updateSelection();
        } else if (e.key === 'Enter') {
            // Apply Item
            const selectedItem = this.choices[this.selectedIndex];
            ItemSystem.applyItem(selectedItem, this.game.playerState);

            // Save progress with the new item 
            const rawSave = localStorage.getItem('typingRpgSaveData');
            if (rawSave) {
                const savedData = JSON.parse(rawSave);
                this.game.playerState.saveToStorage(savedData.level, savedData.mode, savedData.currentHp, 0);

                // Cloud Sync
                CloudSave.saveProgress({
                    level: savedData.level,
                    mode: savedData.mode,
                    currentHp: savedData.currentHp,
                    hpBase: this.game.playerState.hpBase,
                    score: this.game.playerState.score,
                    highestCombo: this.game.playerState.highestCombo,
                    inventory: this.game.playerState.inventory
                });
            }

            // Go back to combat
            this.game.scenes.switchTo('combat', { resume: true });
        }
    }

    public onResize(width: number, height: number): void {
        if (this.titleText) {
            this.titleText.x = width / 2;
            this.titleText.y = height * 0.133;
        }
        if (this.hintText) {
            this.hintText.x = width / 2;
            this.hintText.y = height * 0.833;
        }
        const cardWidth = 220;
        const gap = 30;
        const startX = width / 2 - (cardWidth * 1.5) - gap;
        this.cardGraphics.forEach((g, i) => {
            g.x = startX + i * (cardWidth + gap);
            // updateSelection handles y
        });
        this.cardTexts.forEach((t, i) => {
            t.x = this.cardGraphics[i].x + cardWidth / 2;
            // updateSelection handles y
        });
        this.updateSelection();
    }

    public update(_delta: number) {
        if (this.titleText) {
            this.titleText.alpha = Math.sin(Date.now() / 300) * 0.2 + 0.8;
        }
    }

    public exit() {
        this.container.removeChildren();
        window.removeEventListener('keydown', this.handleKeyDown);
    }
}
