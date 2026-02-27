import { Text, TextStyle } from 'pixi.js';
import { Scene } from './Scene';
import { AchievementSystem, ACHIEVEMENT_DEFINITIONS } from '../utils/AchievementSystem';
import { CloudSave } from '../utils/CloudSave';
import { HeroFactory, type HeroType } from '../heroes/HeroFactory';
import { ShopSystem } from '../shop/ShopSystem';
import { SHOP_ITEMS } from '../shop/ShopData';
import { ITEMS } from '../items/ItemSystem';
import { RefineSystem } from '../items/RefineSystem';

export class MainMenuScene extends Scene {
    private titleText!: Text;
    private optionsText: Text[] = [];
    private selectedIndex = 0;
    private menuOptions: string[] = ['Beginner', 'Intermediate', 'Advanced'];
    private hasSaveData = false;
    private savedLevel = 1;
    private descriptionText!: Text;

    public enter() {
        this.selectedIndex = 0;

        // Check for save data
        const savedData = this.game.playerState.loadFromStorage();
        if (savedData) {
            this.hasSaveData = true;
            this.savedLevel = savedData.level;
            this.menuOptions = [`繼續遊戲 (Lv.${this.savedLevel})`, '新手練習 (Beginner)', '進階練習 (Intermediate)', '高階挑戰 (Advanced)', '選擇英雄', '商店', '成就系統', '排行榜', '遊戲說明'];
        } else {
            this.hasSaveData = false;
            this.menuOptions = ['新手練習 (Beginner)', '進階練習 (Intermediate)', '高階挑戰 (Advanced)', '選擇英雄', '商店', '成就系統', '排行榜', '遊戲說明'];
        }

        const style = new TextStyle({
            fontFamily: 'Courier New',
            fontSize: 48,
            fill: '#ffffff',
            dropShadow: {
                alpha: 0.5,
                color: 0x000000,
                blur: 4,
                distance: 4
            }
        });

        this.titleText = new Text({ text: 'TYPING RPG', style });
        this.titleText.anchor.set(0.5);
        this.titleText.x = this.game.app.screen.width / 2;
        this.titleText.y = this.game.app.screen.height * 0.15;
        this.container.addChild(this.titleText);

        const optionStyle = new TextStyle({
            fontFamily: 'Courier New',
            fontSize: 24,
            fill: '#aaaaaa',
        });

        this.menuOptions.forEach((option, index) => {
            const t = new Text({ text: option, style: optionStyle });
            t.anchor.set(0.5);
            t.x = this.game.app.screen.width / 2;
            t.y = this.game.app.screen.height * 0.30 + index * 36;

            // Make interactive for touch/mouse
            t.interactive = true;
            t.cursor = 'pointer';

            t.on('pointerover', () => {
                this.selectedIndex = index;
                this.updateSelectionUI();
            });

            t.on('pointertap', () => {
                this.selectedIndex = index;
                this.updateSelectionUI();
                this.executeSelection();
            });

            this.optionsText.push(t);
            this.container.addChild(t);
        });

        const descStyle = new TextStyle({
            fontFamily: '"Microsoft JhengHei", Arial',
            fontSize: 20,
            fill: '#888888',
            fontStyle: 'italic'
        });
        this.descriptionText = new Text({ text: '', style: descStyle });
        this.descriptionText.anchor.set(0.5);
        this.descriptionText.x = this.game.app.screen.width / 2;
        this.descriptionText.y = this.game.app.screen.height * 0.9;
        this.container.addChild(this.descriptionText);

        this.updateSelectionUI();

        window.addEventListener('keydown', this.handleKeyDown);
    }

    private updateSelectionUI() {
        this.optionsText.forEach((t, i) => {
            if (i === this.selectedIndex) {
                t.style.fill = '#00ff00';
                t.text = `> ${this.menuOptions[i]} <`;
            } else {
                t.style.fill = '#aaaaaa';
                t.text = this.menuOptions[i];
            }
        });

        // Determine which logical index is selected (offset if Resume exists)
        const modeIdx = this.hasSaveData ? this.selectedIndex - 1 : this.selectedIndex;

        if (this.hasSaveData && this.selectedIndex === 0) {
            this.descriptionText.text = "繼續上次的冒險旅程";
        } else {
            if (modeIdx === 0) this.descriptionText.text = "無時間壓力，針對錯字加強練習";
            else if (modeIdx === 1) this.descriptionText.text = "練習單字 (預設 25秒)";
            else if (modeIdx === 2) this.descriptionText.text = "挑戰模式 (地獄 5秒)";
            else if (modeIdx === 3) this.descriptionText.text = `選擇英雄角色 (目前: ${HeroFactory.getHeroIcon(this.game.playerState.heroType)} ${HeroFactory.getHeroName(this.game.playerState.heroType)})`;
            else if (modeIdx === 4) this.descriptionText.text = `商店 · 購買道具與強化 (💰 ${this.game.playerState.gold} 金幣)`;
            else if (modeIdx === 5) this.descriptionText.text = "查看解鎖的成就";
            else if (modeIdx === 6) this.descriptionText.text = "查看本地前十名的高分紀錄";
            else if (modeIdx === 7) this.descriptionText.text = "查看詳細的遊戲玩法與系統控制";
        }
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowUp') {
            this.selectedIndex = (this.selectedIndex - 1 + this.menuOptions.length) % this.menuOptions.length;
            this.updateSelectionUI();
        } else if (e.key === 'ArrowDown') {
            this.selectedIndex = (this.selectedIndex + 1) % this.menuOptions.length;
            this.updateSelectionUI();
        } else if (e.key === 'Enter') {
            this.executeSelection();
        }
    }

    private executeSelection() {
        if (document.getElementById('typing-rpg-modal')) return;

        if (this.hasSaveData && this.selectedIndex === 0) {
            // Resume
            this.game.scenes.switchTo('combat', { fromResume: true });
        } else {
            const modeIdx = this.hasSaveData ? this.selectedIndex - 1 : this.selectedIndex;

            if (modeIdx === 3) {
                this.showHeroSelectModal();
            } else if (modeIdx === 4) {
                this.showShopModal();
            } else if (modeIdx === 5) {
                this.showAchievementsModal();
            } else if (modeIdx === 6) {
                this.showLeaderboardModal();
            } else if (modeIdx === 7) {
                this.showHelpModal();
            } else {
                // New Game
                const selectedMode = ['Beginner', 'Intermediate', 'Advanced'][modeIdx];
                import('../PlayerState').then(m => m.PlayerState.clearStorage());
                this.game.scenes.switchTo('combat', { mode: selectedMode });
            }
        }
    }

    private showHeroSelectModal() {
        if (document.getElementById('typing-rpg-modal')) return;

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'typing-rpg-modal';
        Object.assign(modalOverlay.style, {
            position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: '1000'
        });

        const modalBox = document.createElement('div');
        Object.assign(modalBox.style, {
            backgroundColor: '#1a1a2e', padding: '25px', borderRadius: '12px',
            color: 'white', fontFamily: '"Microsoft JhengHei", Arial',
            width: '650px', maxHeight: '85%', overflowY: 'auto',
            border: '2px solid #e94560'
        });

        const currentHero = this.game.playerState.heroType;

        const heroData: { type: HeroType; icon: string; name: string; desc: string; color: string }[] = [
            { type: 'warrior', icon: '🗡️', name: '戰士 Warrior', desc: '暗紅鎧甲 · 雙手劍 · 火焰爆裂', color: '#ff4444' },
            { type: 'mage', icon: '🔮', name: '法師 Mage', desc: '藍紫長袍 · 水晶杖 · 魔法箭矢', color: '#00ccff' },
            { type: 'ranger', icon: '🏹', name: '遊俠 Ranger', desc: '翠綠皮甲 · 長弓 · 風之環', color: '#88cc44' },
            { type: 'tank', icon: '🛡️', name: '坦克 Tank', desc: '深藍重甲 · 塔盾 · 衝擊波', color: '#4477bb' },
            { type: 'paladin', icon: '⚔️', name: '聖騎士 Paladin', desc: '白金聖甲 · 聖劍 · 十字聖光', color: '#ffcc00' },
        ];

        let html = `<h2 style="margin-top:0; color:#e94560; text-align:center;">選擇英雄角色</h2>`;
        html += `<div style="display:flex; flex-direction:column; gap:10px;">`;

        for (const h of heroData) {
            const isActive = h.type === currentHero;
            html += `
            <div class="hero-card" data-hero="${h.type}" style="
                display:flex; align-items:center; gap:15px;
                padding:12px 18px; border-radius:10px; cursor:pointer;
                background:${isActive ? '#2a2a4e' : '#16213e'};
                border:2px solid ${isActive ? h.color : '#333'};
                transition: border-color 0.2s, background 0.2s;
            ">
                <div style="font-size:36px;">${h.icon}</div>
                <div style="flex-grow:1;">
                    <div style="font-weight:bold; font-size:18px; color:${h.color};">${h.name}</div>
                    <div style="font-size:13px; color:#aaa;">${h.desc}</div>
                </div>
                ${isActive ? '<div style="color:#0f0; font-size:14px; font-weight:bold;">✓ 使用中</div>' : '<div style="color:#888; font-size:13px;">選擇</div>'}
            </div>`;
        }

        html += `</div>`;
        html += `<div style="text-align:center; margin-top:20px;">
            <button id="close-modal-btn" style="padding:10px 20px; font-size:16px; cursor:pointer; background:#e94560; color:#fff; border:none; border-radius:5px;">關閉</button>
        </div>`;

        modalBox.innerHTML = html;
        modalOverlay.appendChild(modalBox);
        document.body.appendChild(modalOverlay);

        // Bind click events
        modalBox.querySelectorAll('.hero-card').forEach(card => {
            const el = card as HTMLElement;
            el.onmouseenter = () => { if (el.dataset.hero !== currentHero) el.style.borderColor = '#e94560'; };
            el.onmouseleave = () => { if (el.dataset.hero !== currentHero) el.style.borderColor = '#333'; };
            el.onclick = () => {
                const heroType = el.dataset.hero as HeroType;
                this.game.playerState.heroType = heroType;
                this.game.playerState.saveToStorage(this.savedLevel, 'Beginner', 120, 0);
                modalOverlay.remove();
                // Refresh menu to update description
                this.exit();
                this.enter();
            };
        });

        document.getElementById('close-modal-btn')!.onclick = () => modalOverlay.remove();
    }

    private showShopModal() {
        if (document.getElementById('typing-rpg-modal')) return;

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'typing-rpg-modal';
        Object.assign(modalOverlay.style, {
            position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.88)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: '1000'
        });

        const modalBox = document.createElement('div');
        Object.assign(modalBox.style, {
            backgroundColor: '#1a1a2e', padding: '20px', borderRadius: '12px',
            color: 'white', fontFamily: '"Microsoft JhengHei", Arial',
            width: '700px', maxHeight: '85%', overflowY: 'auto',
            border: '2px solid #e94560'
        });
        modalOverlay.appendChild(modalBox);
        document.body.appendChild(modalOverlay);

        const state = this.game.playerState;

        const renderShop = (activeTab: string = 'permanent') => {
            const tabs = [
                { key: 'permanent', label: '永久加成' },
                { key: 'consumable', label: '消耗品' },
                { key: 'special', label: '特殊道具' },
                { key: 'refine', label: '洗鍊強化' },
            ];

            let html = `<h2 style="margin-top:0; color:#e94560; text-align:center;">🏪 商店 <span style="color:#ffcc00;font-size:16px;">💰 ${state.gold} 金幣</span></h2>`;

            // Tab bar
            html += `<div style="display:flex; gap:5px; margin-bottom:15px; justify-content:center;">`;
            for (const tab of tabs) {
                const isActive = tab.key === activeTab;
                html += `<button class="shop-tab" data-tab="${tab.key}" style="
                    padding:8px 16px; border:1px solid ${isActive ? '#e94560' : '#555'}; border-radius:6px;
                    background:${isActive ? '#e94560' : '#16213e'}; color:#fff; cursor:pointer; font-size:14px;
                    font-family:inherit;
                ">${tab.label}</button>`;
            }
            html += `</div>`;

            if (activeTab !== 'refine') {
                // Shop items
                const items = SHOP_ITEMS.filter(i => i.category === activeTab);
                html += `<div style="display:flex; flex-direction:column; gap:8px;">`;
                for (const item of items) {
                    const owned = ShopSystem.getOwnedCount(item.id, state);
                    const maxed = ShopSystem.isMaxed(item, state);
                    const canBuy = ShopSystem.canAfford(item, state) && !maxed;
                    const stackText = item.maxStack > 0 ? ` (${owned}/${item.maxStack})` : (item.category === 'consumable' ? ` (持有: ${owned})` : '');

                    html += `<div style="display:flex; align-items:center; gap:12px; padding:10px 15px; border-radius:8px; background:#16213e; border:1px solid #333;">
                        <div style="font-size:28px; width:40px; text-align:center;">${item.icon}</div>
                        <div style="flex-grow:1;">
                            <div style="font-weight:bold; font-size:15px; color:${maxed ? '#888' : '#fff'};">${item.name}${stackText}</div>
                            <div style="font-size:12px; color:#aaa;">${item.description}</div>
                        </div>
                        <div style="text-align:right; min-width:100px;">
                            <div style="color:#ffcc00; font-size:14px; margin-bottom:4px;">💰 ${item.price}</div>
                            ${maxed
                            ? '<span style="color:#888; font-size:12px;">已滿</span>'
                            : `<button class="shop-buy-btn" data-item-id="${item.id}" style="
                                    padding:5px 12px; border:none; border-radius:4px; cursor:${canBuy ? 'pointer' : 'not-allowed'};
                                    background:${canBuy ? '#00aa44' : '#444'}; color:#fff; font-size:13px; font-family:inherit;
                                    opacity:${canBuy ? '1' : '0.5'};
                                ">購買</button>`
                        }
                        </div>
                    </div>`;
                }
                html += `</div>`;
            } else {
                // Refine tab
                const ownedItems = state.inventory.filter((id, idx) => state.inventory.indexOf(id) === idx);
                if (ownedItems.length === 0) {
                    html += `<div style="text-align:center; padding:40px; color:#888;">還沒有可洗鍊的道具<br>先在戰鬥中獲取道具吧！</div>`;
                } else {
                    html += `<div style="display:flex; flex-direction:column; gap:8px;">`;
                    for (const itemId of ownedItems) {
                        const itemDef = ITEMS.find(i => i.id === itemId);
                        if (!itemDef) continue;
                        const currentLvl = state.enhanceLevels[itemId] || 0;
                        const cost = RefineSystem.getUpgradeCost(currentLvl);
                        const rate = RefineSystem.getSuccessRate(currentLvl, itemDef.rarity);
                        const atMax = currentLvl >= RefineSystem.maxLevel;
                        const canRefine = !atMax && cost !== Infinity && state.gold >= cost;
                        const rarityColor = itemDef.rarity === 'SSR' ? '#ffaa00' : (itemDef.rarity === 'SR' ? '#cc88ff' : '#aaa');
                        const stacks = state.itemStacks[itemId] || 0;
                        const multiplier = RefineSystem.getEnhancedMultiplier(currentLvl);

                        // Stars display
                        let stars = '';
                        for (let i = 0; i < RefineSystem.maxLevel; i++) {
                            stars += i < currentLvl ? '★' : '☆';
                        }

                        html += `<div style="display:flex; align-items:center; gap:12px; padding:10px 15px; border-radius:8px; background:#16213e; border:1px solid ${rarityColor}33;">
                            <div style="flex-grow:1;">
                                <div style="font-weight:bold; font-size:15px;">
                                    <span style="color:${rarityColor};">[${itemDef.rarity}]</span> ${itemDef.name} ×${stacks}
                                    ${currentLvl > 0 ? `<span style="color:#ffcc00;"> +${currentLvl}</span>` : ''}
                                </div>
                                <div style="font-size:11px; color:#aaa;">${itemDef.description} (效果 ×${multiplier.toFixed(1)})</div>
                                <div style="font-size:12px; color:#ffcc00; letter-spacing:2px;">${stars}</div>
                            </div>
                            <div style="text-align:right; min-width:120px;">
                                ${atMax
                                ? '<span style="color:#ffcc00; font-size:13px;">✨ 已滿級</span>'
                                : `<div style="font-size:12px; color:#aaa; margin-bottom:3px;">💰 ${cost} · ${Math.round(rate * 100)}%</div>
                                       <button class="shop-refine-btn" data-item-id="${itemId}" style="
                                           padding:5px 12px; border:none; border-radius:4px; cursor:${canRefine ? 'pointer' : 'not-allowed'};
                                           background:${canRefine ? '#cc6600' : '#444'}; color:#fff; font-size:13px; font-family:inherit;
                                           opacity:${canRefine ? '1' : '0.5'};
                                       ">洗鍊</button>`
                            }
                            </div>
                        </div>`;
                    }
                    html += `</div>`;
                }
            }

            html += `<div style="text-align:center; margin-top:15px;">
                <button id="close-modal-btn" style="padding:8px 18px; font-size:15px; cursor:pointer; background:#e94560; color:#fff; border:none; border-radius:5px; font-family:inherit;">關閉</button>
            </div>`;

            modalBox.innerHTML = html;

            // Bind tab switching
            modalBox.querySelectorAll('.shop-tab').forEach(btn => {
                (btn as HTMLElement).onclick = () => renderShop((btn as HTMLElement).dataset.tab || 'permanent');
            });

            // Bind buy buttons
            modalBox.querySelectorAll('.shop-buy-btn').forEach(btn => {
                (btn as HTMLElement).onclick = () => {
                    const itemId = (btn as HTMLElement).dataset.itemId!;
                    const shopItem = SHOP_ITEMS.find(i => i.id === itemId);
                    if (!shopItem) return;
                    const success = ShopSystem.purchase(shopItem, state);
                    if (success) {
                        state.saveToStorage(this.savedLevel, 'Beginner', 120, 0);
                        renderShop(activeTab);
                    }
                };
            });

            // Bind refine buttons
            modalBox.querySelectorAll('.shop-refine-btn').forEach(btn => {
                (btn as HTMLElement).onclick = () => {
                    const itemId = (btn as HTMLElement).dataset.itemId!;
                    const itemDef = ITEMS.find(i => i.id === itemId);
                    if (!itemDef) return;
                    const result = RefineSystem.attemptRefine(itemId, itemDef.rarity, state);
                    state.saveToStorage(this.savedLevel, 'Beginner', 120, 0);

                    // Flash feedback
                    const el = btn as HTMLElement;
                    if (result.success) {
                        el.textContent = '✨ 成功!';
                        el.style.background = '#00cc44';
                    } else {
                        el.textContent = '💔 失敗';
                        el.style.background = '#cc0000';
                    }
                    setTimeout(() => renderShop(activeTab), 800);
                };
            });

            document.getElementById('close-modal-btn')!.onclick = () => {
                modalOverlay.remove();
                this.exit();
                this.enter();
            };
        };

        renderShop();
    }

    private showHelpModal() {
        if (document.getElementById('typing-rpg-modal')) return;

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'typing-rpg-modal';
        Object.assign(modalOverlay.style, {
            position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: '1000'
        });

        const modalBox = document.createElement('div');
        Object.assign(modalBox.style, {
            backgroundColor: '#2a2a35', padding: '30px', borderRadius: '12px',
            color: 'white', fontFamily: '"Microsoft JhengHei", Arial',
            width: '600px', maxHeight: '80%', overflowY: 'auto',
            border: '2px solid #4CAF50', lineHeight: '1.6'
        });

        modalBox.innerHTML = `
            <h2 style="margin-top:0; color:#4CAF50; text-align:center;">遊戲說明 (How to Play)</h2>
            <p>歡迎來到 Typing RPG！在這裡你需要透過打字來擊敗怪物。</p>
            <h3>難度差異</h3>
            <ul>
                <li><strong>Beginner：</strong>只有隨機字母，容錯率高，節奏慢。</li>
                <li><strong>Intermediate：</strong>練習單字，每回合給予 5 個單字，25秒倒數。</li>
                <li><strong>Advanced：</strong>挑戰極限，每回合 5 個單字，只有 5秒倒數！</li>
            </ul>
            <h3>戰鬥系統與 Combo</h3>
            <ul>
                <li>連續輸入正確字元會累積 Combo，Combo 越高攻擊越高！全對會觸發 Perfect。</li>
                <li>打錯字會重置 Combo，且影響結算準確率 (Accuracy)。</li>
            </ul>
            <h3>系統控制 (Controls)</h3>
            <ul>
                <li><strong>ESC：</strong>暫停遊戲 / 開啟暫停選單。</li>
                <li><strong>M 鍵：</strong>在暫停選單中按下可直接「退回主選單」。</li>
                <li><strong>行動裝置：</strong>點擊畫面任何地方即可喚起虛擬鍵盤。</li>
            </ul>
            <div style="text-align:center; margin-top:20px;">
                <button id="close-modal-btn" style="padding:10px 20px; font-size:16px; cursor:pointer; background:#f44336; color:#fff; border:none; border-radius:5px;">關閉</button>
            </div>
        `;

        modalOverlay.appendChild(modalBox);
        document.body.appendChild(modalOverlay);

        document.getElementById('close-modal-btn')!.onclick = () => modalOverlay.remove();
    }

    private showAchievementsModal() {
        if (document.getElementById('typing-rpg-modal')) return;

        const stats = AchievementSystem.loadStats();

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'typing-rpg-modal';
        Object.assign(modalOverlay.style, {
            position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: '1000'
        });

        const modalBox = document.createElement('div');
        Object.assign(modalBox.style, {
            backgroundColor: '#222', padding: '20px', borderRadius: '10px',
            color: 'white', fontFamily: 'Courier New, monospace',
            width: '600px', maxHeight: '80%', overflowY: 'auto',
            border: '2px solid #ffd700'
        });

        let html = `<h2 style="color:#ffd700; text-align:center; margin-top:0;">解鎖成就 (Achievements)</h2>`;
        html += `<ul style="list-style:none; padding:0;">`;

        for (const def of ACHIEVEMENT_DEFINITIONS) {
            const isUnlocked = !!stats.unlockedAchievements[def.id];
            const ts = stats.unlockedAchievements[def.id];
            const dateStr = ts ? new Date(ts).toLocaleDateString() : "";
            const progress = def.getProgress(stats);
            const clampedProgress = Math.min(progress, def.maxProgress);

            html += `
            <li style="margin-bottom: 15px; background: #333; padding: 10px; border-radius: 8px; display:flex; align-items:center;">
                <div style="font-size: 32px; filter: ${isUnlocked ? 'none' : 'grayscale(100%)'}; margin-right: 15px;">${def.icon}</div>
                <div style="flex-grow:1;">
                    <div style="font-weight:bold; font-size:18px; color: ${isUnlocked ? '#fff' : '#888'};">${def.title}</div>
                    <div style="font-size:14px; color:#aaa;">${def.description}</div>
                    ${isUnlocked ? `<div style="font-size:12px; color:#0f0;">已於 ${dateStr} 解鎖 - 獎勵: ${def.rewardDesc}</div>`
                    : `<div style="font-size:12px; color:#f80;">進度: ${clampedProgress}/${def.maxProgress}</div>`}
                </div>
            </li>`;
        }

        html += `</ul>
        <div style="text-align:center; margin-top:20px;">
            <button id="close-modal-btn" style="padding:10px 20px; font-size:16px; cursor:pointer; background:#555; color:#fff; border:none; border-radius:5px;">關閉</button>
        </div>`;

        modalBox.innerHTML = html;
        modalOverlay.appendChild(modalBox);
        document.body.appendChild(modalOverlay);

        document.getElementById('close-modal-btn')!.onclick = () => modalOverlay.remove();
    }

    private async showLeaderboardModal() {
        if (document.getElementById('typing-rpg-modal')) return;

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'typing-rpg-modal';
        Object.assign(modalOverlay.style, {
            position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: '1000'
        });

        const modalBox = document.createElement('div');
        Object.assign(modalBox.style, {
            backgroundColor: '#222', padding: '20px', borderRadius: '10px',
            color: 'white', fontFamily: 'Courier New, monospace',
            width: '650px', maxHeight: '85%', overflowY: 'auto',
            border: '2px solid #00ff00', position: 'relative'
        });

        modalBox.innerHTML = `<h2 style="color:#00ff00; text-align:center; margin-top:0;">雲端排行榜 (Class Leaderboard)</h2>
                              <p style="text-align:center; color:#aaa;">正在連線至雲端試算表...</p>`;

        modalOverlay.appendChild(modalBox);
        document.body.appendChild(modalOverlay);

        const data = await CloudSave.fetchGlobalLeaderboard();

        const renderCategory = (mode: string) => {
            const list = data ? data[mode] : [];
            let tableHtml = `
            <table style="width:100%; border-collapse:collapse; text-align:left; margin-top:10px;">
                <tr style="border-bottom:1px solid #555; color:#0f0;">
                    <th style="padding:8px 5px;">排名</th>
                    <th>學號 (ID)</th>
                    <th>關卡</th>
                    <th>總分</th>
                    <th>連擊</th>
                </tr>`;

            if (!list || list.length === 0) {
                tableHtml += `<tr><td colspan="5" style="text-align:center; padding:20px; color:#666;">該模式尚未有紀錄</td></tr>`;
            } else {
                list.forEach((r, idx) => {
                    tableHtml += `
                    <tr style="border-bottom:1px solid #444;">
                        <td style="padding:8px 5px; color:#ffd700;">#${idx + 1}</td>
                        <td style="color:#fff; font-weight:bold;">${r.classId}</td>
                        <td style="color:#aaa;">Lv.${r.level}</td>
                        <td style="color:#0f0;">${r.score.toLocaleString()}</td>
                        <td style="color:#888; font-size:12px;">${r.maxCombo}</td>
                    </tr>`;
                });
            }
            tableHtml += `</table>`;
            return tableHtml;
        };

        const updateContent = (activeMode: string) => {
            const tabs = ['Beginner', 'Intermediate', 'Advanced'];
            const names: Record<string, string> = { 'Beginner': '新手練習', 'Intermediate': '進階練習', 'Advanced': '高階挑戰' };

            let html = `<h2 style="color:#00ff00; text-align:center; margin-top:0;">雲端排行榜 (Class Leaderboard)</h2>`;

            // Tab Menu
            html += `<div style="display:flex; justify-content:center; gap:10px; margin-bottom:15px;">`;
            tabs.forEach(m => {
                const isActive = m === activeMode;
                html += `<button class="ldr-tab" data-mode="${m}" style="padding:5px 15px; cursor:pointer; background:${isActive ? '#00ff00' : '#444'}; color:${isActive ? '#000' : '#eee'}; border:none; border-radius:4px; font-weight:bold;">${names[m]}</button>`;
            });
            html += `</div>`;

            // Table Content
            html += `<div id="ldr-table-container">${renderCategory(activeMode)}</div>`;

            // Footer
            html += `
            <div style="text-align:center; margin-top:20px;">
                <button id="close-modal-btn" style="padding:10px 20px; font-size:16px; cursor:pointer; background:#555; color:#fff; border:none; border-radius:5px;">關閉</button>
            </div>`;

            modalBox.innerHTML = html;

            // Re-bind events
            modalBox.querySelectorAll('.ldr-tab').forEach(btn => {
                const b = btn as HTMLButtonElement;
                b.onclick = () => updateContent(b.dataset.mode!);
            });
            document.getElementById('close-modal-btn')!.onclick = () => modalOverlay.remove();
        };

        updateContent('Beginner');
    }

    public update(_delta: number) {
        if (this.optionsText[this.selectedIndex]) {
            this.optionsText[this.selectedIndex].alpha = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        }
    }

    public onResize(width: number, height: number): void {
        if (this.titleText) {
            this.titleText.x = width / 2;
            this.titleText.y = height * 0.25;
        }
        this.optionsText.forEach((t, index) => {
            t.x = width / 2;
            t.y = height * 0.43 + index * 45;
        });
        if (this.descriptionText) {
            this.descriptionText.x = width / 2;
            this.descriptionText.y = height * 0.9;
        }
    }

    public exit() {
        this.container.removeChildren();
        this.optionsText = [];
        window.removeEventListener('keydown', this.handleKeyDown);
    }
}
