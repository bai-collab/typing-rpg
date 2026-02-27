import { Text, TextStyle, Container, Graphics, Ticker } from 'pixi.js';
import { Scene } from './Scene';
import { CloudSave } from '../utils/CloudSave';
import { ITEMS } from '../items/ItemSystem';
import { tweenManager, Easing } from '../utils/Tween';
import { VOCABULARY, type VocabWord } from '../data/Vocabulary';
import { AchievementSystem, type AchievementDef } from '../utils/AchievementSystem';
import { LeaderboardSystem } from '../utils/LeaderboardSystem';
import { HeroFactory } from '../heroes/HeroFactory';
import { applyShopPermanents, applyConsumables } from '../shop/ShopData';

interface TargetItem {
    text: string;
    wordData?: VocabWord;
}

interface LevelBuffs {
    atkBonus: number;
    defBonus: number;
    berserkActive: boolean;
    regenTurnsRemaining: number;
}

// -- Simple Audio Util via Web Audio API --
class AudioUtils {
    private static ctx: AudioContext | null = null;

    private static init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public static playDing(pitchMultiplier: number = 1.0) {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880 * pitchMultiplier, this.ctx.currentTime); // A5 scaled
        osc.frequency.exponentialRampToValueAtTime(1760 * pitchMultiplier, this.ctx.currentTime + 0.1); // Slide up

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    public static playDong() {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime); // A3
        osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.2); // Slide down

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
    }

    public static playExplosion() {
        this.init();
        if (!this.ctx) return;
        // Simple noise burst for explosion
        const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds of noise
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.5);
        filter.frequency.value = 1000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }

    public static playHit() {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }
}

export class CombatScene extends Scene {
    // Game State
    private level: number = 1;
    private state: 'STARTING' | 'TYPING' | 'RESOLVING' | 'GAME_OVER' = 'STARTING';
    private mode: string = 'Beginner';

    // Entity Stats
    private heroAtk = 2;
    private heroDef = 3;
    private heroMaxHp = 120;
    private heroHp = 120;
    private heroHeal = 2;

    private monsterAtk = 5;
    private monsterDef = 1;
    private monsterHp = 100;
    private monsterMaxHp = 100;

    // Typing State
    private timeLimit = 8;
    private timeLeft = 8;
    private targetWord = "";
    private targetQueue: TargetItem[] = [];
    private targetQueueIndex: number = 0;
    private typedIndex = 0;
    private errors = 0;
    private currentCombo = 0; // Tracks consecutive hits spanning turns

    private levelBuffs: LevelBuffs = {
        atkBonus: 0,
        defBonus: 0,
        berserkActive: false,
        regenTurnsRemaining: 0
    };

    // UI Elements
    private levelText!: Text;
    private heroHpText!: Text;
    private monsterHpText!: Text;
    private wordContainer!: Container;
    private letterTexts: Text[] = [];
    private timerGraphics!: Graphics;
    private feedbackText!: Text;
    private itemsContainer!: Container;

    // Advanced Visuals
    private comboContainer!: Container;
    private comboScoreText!: Text;
    private orbitGraphics: Graphics[] = [];
    private flashOverlay!: Graphics;

    // Entities graphics
    private heroSprite!: Graphics;
    private monsterSprite!: Graphics;

    // Particles
    private particles: { graphics: Graphics, vx: number, vy: number, life: number, maxLife: number }[] = [];

    private usedReviveThisLevel: boolean = false;
    private levelErrors: number = 0;
    private tookDamageThisLevel: boolean = false;
    private typedCharsThisLevel: number = 0;
    private startTimeThisLevel: number = 0;
    private mobileHintText: Text | null = null;

    private isInventoryExpanded: boolean = false;
    private isPaused: boolean = false;
    private pauseOverlay: Container | null = null;

    private mobileInput: HTMLInputElement | null = null;

    public async enter(data?: any) {
        this.usedReviveThisLevel = false;
        this.levelErrors = 0;
        this.tookDamageThisLevel = false;
        this.typedCharsThisLevel = 0;
        this.startTimeThisLevel = Date.now();
        this.state = 'STARTING';
        if (data?.level) this.level = data.level;
        this.isInventoryExpanded = false;
        this.isPaused = false;
        if (this.pauseOverlay) {
            this.container.removeChild(this.pauseOverlay);
            this.pauseOverlay.destroy({ children: true });
            this.pauseOverlay = null;
        }

        if (!data?.resume) {
            // New Game or Loading from Global Save
            const savedData = await this.game.playerState.loadFromStorage();

            if (savedData && data?.fromResume) {
                // Resume logic
                this.mode = savedData.mode;
                this.level = savedData.level;
                this.heroHp = savedData.currentHp;

                // Re-apply item buffs
                await this.game.playerState.applyInventory();
                applyShopPermanents(this.game.playerState);
                this.applyPlayerStats();

                this.setupUI();
                this.setupMonster();
                this.startTurn();
            } else {
                // Fresh Start
                this.mode = data?.mode || 'Beginner';
                this.game.playerState.resetBuffs();
                this.game.playerState.inventory = [];
                this.game.playerState.score = 0;
                this.game.playerState.highestCombo = 0;
                applyShopPermanents(this.game.playerState);
                applyConsumables(this.game.playerState);
                this.applyPlayerStats();
                this.heroHp = this.heroMaxHp;
                this.level = 1;

                this.setupUI();
                this.addMobileHint();
                this.setupMonster();
                this.startTurn();
            }
        } else {
            // Transitioning between levels (ItemRewardScene -> CombatScene)
            this.applyPlayerStats();
            this.level++;
            this.heroHp = Math.min(this.heroMaxHp, this.heroHp);

            this.levelBuffs = { atkBonus: 0, defBonus: 0, berserkActive: false, regenTurnsRemaining: 0 };

            this.setupUI();
            this.addMobileHint();
            this.setupMonster();
            this.startTurn();
        }

        // Auto-save at the start of every Combat Level
        this.game.playerState.saveToStorage(this.level, this.mode, this.heroHp, 0);

        window.addEventListener('keydown', this.handleKeyDown);

        this.createMobileInput();
        window.addEventListener('pointerdown', this.handlePointerDown);

        // Start idle animations
        this.animateCharacters();
    }

    private addMobileHint() {
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouch) {
            this.mobileHintText = new Text({
                text: '(Tap screen to show keyboard)',
                style: new TextStyle({ fontFamily: 'Arial', fontSize: 14, fill: '#666', fontStyle: 'italic' })
            });
            this.mobileHintText.anchor.set(0.5);
            this.mobileHintText.x = this.game.app.screen.width / 2;
            this.mobileHintText.y = this.game.app.screen.height - 30;
            this.container.addChild(this.mobileHintText);
        }
    }

    private createMobileInput() {
        if (this.mobileInput) return;
        this.mobileInput = document.createElement('input');
        this.mobileInput.type = 'text';
        this.mobileInput.style.position = 'absolute';
        this.mobileInput.style.opacity = '0';
        this.mobileInput.style.pointerEvents = 'none';
        this.mobileInput.style.zIndex = '-1';
        this.mobileInput.style.top = '0';
        this.mobileInput.style.left = '0';
        this.mobileInput.setAttribute('autocapitalize', 'none');
        this.mobileInput.setAttribute('autocorrect', 'off');

        document.body.appendChild(this.mobileInput);
        this.mobileInput.addEventListener('input', this.handleMobileInput);
    }

    private handleMobileInput = (e: Event) => {
        const input = e.target as HTMLInputElement;
        const value = input.value;
        if (value.length > 0) {
            const char = value[value.length - 1];
            this.processInput(char);
            input.value = ''; // clear for next char
        }
    };

    private handlePointerDown = () => {
        if (this.mobileInput && this.state === 'TYPING' && !this.isPaused) {
            this.mobileInput.focus();
        }
    };

    private applyPlayerStats() {
        const p = this.game.playerState;
        this.heroAtk = Math.max(1, Math.floor(2 * (p.attackMultiplier + p.achievementAtkBonus)));
        this.heroDef = Math.max(0, Math.floor(3 * p.defenseMultiplier));

        // Scale current HP based on ratio? Or just flat increase.
        // Easiest is to keep flat HP, just raise max. But if we want, we can buff it. Let's just raise max.
        const prevMax = this.heroMaxHp;
        this.heroMaxHp = Math.floor(120 * (p.hpMultiplier + p.achievementHpBonus));
        // If Max HP increased, give them the diff
        if (this.heroMaxHp > prevMax) {
            this.heroHp += (this.heroMaxHp - prevMax);
        }

        this.heroHeal = Math.floor(2 * p.healMultiplier);
    }

    private setupUI() {
        this.container.removeChildren(); // clear any previous UI if restarted
        const sw = this.game.app.screen.width;
        const sh = this.game.app.screen.height;

        // Draw entities
        this.heroSprite = HeroFactory.drawHero(this.game.playerState.heroType, sh);
        this.heroSprite.x = sw * 0.1875; // 150/800
        this.heroSprite.y = sh * 0.666;  // 400/600

        this.monsterSprite = this.drawMonster();
        this.monsterSprite.x = sw * 0.6875; // 550/800
        this.monsterSprite.y = sh * 0.616;  // 370/600

        const textStyle = new TextStyle({
            fontFamily: 'Courier New',
            fontSize: 24,
            fill: '#ffffff',
        });

        this.levelText = new Text({ text: 'Level 1', style: textStyle });
        this.levelText.x = 20;
        this.levelText.y = 20;

        this.heroHpText = new Text({ text: `Hero HP: ${this.heroHp}/${this.heroMaxHp}`, style: textStyle });
        this.heroHpText.anchor.set(0, 1);
        this.heroHpText.x = 20;
        this.heroHpText.y = sh - 20;

        this.monsterHpText = new Text({ text: `Monster HP: -/-`, style: textStyle });
        this.monsterHpText.anchor.set(1, 1);
        this.monsterHpText.x = sw - 20;
        this.monsterHpText.y = sh - 20;

        this.wordContainer = new Container();
        this.wordContainer.x = sw / 2;
        this.wordContainer.y = sh * 0.416; // 250/600

        this.timerGraphics = new Graphics();
        this.timerGraphics.x = sw / 2 - 200;
        this.timerGraphics.y = sh / 2;

        this.feedbackText = new Text({ text: '', style: new TextStyle({ fontFamily: 'Courier New', fontSize: 36, fill: '#ffff00', align: 'center', dropShadow: { alpha: 0.8, color: '#000000', distance: 2, blur: 2 } }) });
        this.feedbackText.anchor.set(0.5);
        this.feedbackText.x = sw / 2;
        this.feedbackText.y = sh * 0.25; // 150/600

        // Combo UI
        this.comboContainer = new Container();
        this.comboContainer.x = sw / 2;
        this.comboContainer.y = sh * 0.166; // 100/600
        this.comboScoreText = new Text({ text: '', style: new TextStyle({ fontFamily: 'Courier New', fontSize: 48, fontWeight: 'bold', fill: '#00ffff', align: 'center', dropShadow: { alpha: 0.8, color: '#000000', distance: 3, blur: 3 } }) });
        this.comboScoreText.anchor.set(0.5);
        this.comboContainer.addChild(this.comboScoreText);

        // Flash Overlay
        this.flashOverlay = new Graphics();
        this.flashOverlay.rect(0, 0, sw, sh).fill({ color: 0xffffff });
        this.flashOverlay.alpha = 0;

        this.container.addChild(this.heroSprite);
        this.container.addChild(this.monsterSprite);
        this.container.addChild(this.levelText);
        this.container.addChild(this.heroHpText);
        this.container.addChild(this.monsterHpText);
        this.container.addChild(this.wordContainer);
        this.container.addChild(this.timerGraphics);
        this.container.addChild(this.feedbackText);
        this.container.addChild(this.comboContainer);
        this.container.addChild(this.flashOverlay);

        // HeroFactory already handles idle glow effects

        // Draw acquired items
        this.itemsContainer = new Container();
        this.itemsContainer.x = 20;
        this.itemsContainer.y = 60;
        this.renderItems();
        this.container.addChild(this.itemsContainer);
    }

    private renderItems() {
        this.itemsContainer.removeChildren();
        const itemStacks = this.game.playerState.itemStacks;
        const keys = Object.keys(itemStacks);

        const titleText = new Text({
            text: `獲得戰利品 ${this.isInventoryExpanded ? '[▲]' : '[▼]'}:`,
            style: new TextStyle({ fontFamily: 'Courier New, "Microsoft JhengHei", sans-serif', fontSize: 16, fill: '#aaaaaa' })
        });
        titleText.eventMode = 'static';
        titleText.cursor = 'pointer';
        titleText.on('pointerdown', () => {
            this.isInventoryExpanded = !this.isInventoryExpanded;
            this.renderItems();
        });
        this.itemsContainer.addChild(titleText);

        if (!this.isInventoryExpanded || keys.length === 0) return;

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

    private setupMonster() {
        let multiplier = 1;
        if (this.level <= 10) multiplier = Math.pow(1.12, this.level - 1);
        else if (this.level <= 25) multiplier = Math.pow(1.12, 9) * Math.pow(1.10, this.level - 10);
        else if (this.level <= 50) multiplier = Math.pow(1.12, 9) * Math.pow(1.10, 15) * Math.pow(1.08, this.level - 25);
        else multiplier = Math.pow(1.12, 9) * Math.pow(1.10, 15) * Math.pow(1.08, 25) * Math.pow(1.05, this.level - 50);

        this.monsterMaxHp = Math.floor(100 * multiplier);
        this.monsterHp = this.monsterMaxHp;
        this.monsterAtk = Math.max(5, Math.floor(5 * multiplier));
        this.monsterDef = Math.max(1, Math.floor(Math.pow(1.39, this.level - 1)));
    }

    private startTurn() {
        this.state = 'TYPING';

        // Mode Specific Targets & Time

        this.targetQueue = [];
        this.targetQueueIndex = 0;

        if (this.mode === 'Beginner') {
            // 5 words with weighting
            for (let i = 0; i < 5; i++) {
                const wordData = this.getWeightedWord();
                this.targetQueue.push({ text: wordData.word.toLowerCase(), wordData });
            }
            this.timeLimit = 3600; // 1 hour, effectively no timer
        } else if (this.mode === 'Intermediate') {
            // 5 random words, simplified advanced
            for (let i = 0; i < 5; i++) {
                const wordData = VOCABULARY[Math.floor(Math.random() * VOCABULARY.length)];
                this.targetQueue.push({ text: wordData.word.toLowerCase(), wordData });
            }
            this.targetQueue.sort(() => Math.random() - 0.5);
            this.timeLimit = 25;
        } else if (this.mode === 'Advanced') {
            // 5 random words
            for (let i = 0; i < 5; i++) {
                const wordData = VOCABULARY[Math.floor(Math.random() * VOCABULARY.length)];
                this.targetQueue.push({ text: wordData.word.toLowerCase(), wordData });
            }
            // Shuffle
            this.targetQueue.sort(() => Math.random() - 0.5);
            this.timeLimit = 5;
        }

        this.targetWord = this.targetQueue[0].text;
        this.typedIndex = 0;
        this.errors = 0;
        this.currentCombo = 0;
        if (this.comboScoreText) this.comboScoreText.text = '';

        this.orbitGraphics.forEach(g => { if (!g.destroyed) { this.container.removeChild(g); g.destroy(); } });
        this.orbitGraphics = [];

        // Auto heal at start of turn (SSR Heal item)
        const p = this.game.playerState;
        if (p.autoHealRate > 0) {
            const healVal = Math.floor(this.heroMaxHp * p.autoHealRate);
            if (healVal > 0) {
                this.heroHp = Math.min(this.heroMaxHp, this.heroHp + healVal);
                this.showDamageNumber(this.heroSprite.x, this.heroSprite.y - 20, "Auto-Heal +" + healVal, '#00ff00');
            }
        }

        this.timeLimit += p.timeAddition;
        this.timeLeft = this.timeLimit;

        this.updateUI();
        this.renderWord();
    }

    private getCategoryIcon(cat?: string): string {
        if (!cat) return "";
        if (cat.includes('衣服') || cat.includes('配件')) return "🛡️";
        if (cat.includes('食物') || cat.includes('飲料')) return "⚔️";
        if (cat.includes('時間')) return "⏰";
        if (cat.includes('學校')) return "❤️";
        if (cat.includes('動物') || cat.includes('昆蟲')) return "🐾";
        if (cat.includes('天氣') || cat.includes('自然')) return "🍃";
        return ""; // Other categories don't have buffs in this specific mode spec yet
    }

    private renderWord() {
        this.wordContainer.removeChildren();
        this.letterTexts = [];

        if (this.mode === 'Beginner') {
            const letterSpacing = 30;
            const fontSize = 40;
            const totalWidth = this.targetWord.length * letterSpacing;
            const startX = -totalWidth / 2 + letterSpacing / 2;

            for (let i = 0; i < this.targetWord.length; i++) {
                const char = this.targetWord[i];
                const t = new Text({
                    text: char,
                    style: new TextStyle({
                        fontFamily: 'Courier New',
                        fontSize: fontSize,
                        fill: i < this.typedIndex ? '#00ff00' : '#ffffff',
                        dropShadow: { alpha: 0.8, color: '#000000', distance: 2 }
                    })
                });
                t.anchor.set(0.5);
                t.x = startX + i * letterSpacing;
                this.wordContainer.addChild(t);
                this.letterTexts.push(t);
            }
        } else {
            // Advanced Mode layout (3x2 grid)
            let currentX = -200; // Start a bit more to the right to avoid left UI
            let currentY = -110;

            this.targetQueue.forEach((item, index) => {
                // Break into 2 rows of 3 and 2
                if (index === 3) {
                    currentX = -100; // Center the 2 items a bit more
                    currentY += 90; // Add enough vertical space for Chinese and icon
                }

                const isActive = index === this.targetQueueIndex;
                const isCompleted = index < this.targetQueueIndex;
                const color = isCompleted ? '#555555' : (isActive ? '#ffffff' : '#aaaaaa');

                const wordGroup = new Container();
                wordGroup.x = currentX;
                wordGroup.y = currentY;

                let cx = 0;
                for (let i = 0; i < item.text.length; i++) {
                    const charColor = (isActive && i < this.typedIndex) ? '#00ff00' : color;
                    const charText = new Text({
                        text: item.text[i],
                        style: new TextStyle({
                            fontFamily: 'Courier New',
                            fontSize: 24,
                            fill: charColor,
                            fontWeight: isActive ? 'bold' : 'normal',
                            dropShadow: { alpha: 0.8, color: '#000000', distance: 1 }
                        })
                    });
                    charText.x = cx;
                    cx += 15;
                    wordGroup.addChild(charText);

                    if (isActive) {
                        this.letterTexts.push(charText);
                    }
                }

                if (item.wordData) {
                    const meaningText = new Text({
                        text: item.wordData.meaning,
                        style: new TextStyle({ fontFamily: '"Microsoft JhengHei", sans-serif', fontSize: 14, fill: color })
                    });
                    meaningText.y = 28;
                    meaningText.x = (cx / 2) - (meaningText.width / 2);
                    if (isCompleted) meaningText.alpha = 0.3;
                    wordGroup.addChild(meaningText);

                    const iconStr = this.getCategoryIcon(item.wordData.categoryZh);
                    if (iconStr) {
                        const iconText = new Text({ text: iconStr, style: new TextStyle({ fontSize: 16 }) });
                        iconText.y = 45;
                        iconText.x = (cx / 2) - 8;
                        if (isCompleted) iconText.alpha = 0.3; // Dim icon if completed
                        wordGroup.addChild(iconText);
                    }
                }

                this.wordContainer.addChild(wordGroup);
                currentX += Math.max(cx, item.wordData ? 80 : 0) + 40; // space between words, ensuring enough room for Chinese text
            });
        }
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            this.togglePause();
            return;
        }

        if (this.isPaused) {
            if (e.key === 'm' || e.key === 'M') {
                this.game.scenes.switchTo('menu');
            }
            return;
        }

        if (this.state === 'GAME_OVER') {
            return;
        }

        if (this.state !== 'TYPING') return;

        // Ignore modifiers
        if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) return;

        this.processInput(e.key);
    };

    private processInput(key: string) {
        if (this.state !== 'TYPING' || this.isPaused) return;

        // Ensure audio context is started on user interaction
        AudioUtils['init']?.();

        const expectedchar = this.targetWord[this.typedIndex];
        if (key.toUpperCase() === expectedchar.toUpperCase()) {
            // Correct
            this.letterTexts[this.typedIndex].style.fill = '#00ff00';
            const pitch = 1.0 + (this.currentCombo * 0.05);
            AudioUtils.playDing(Math.min(pitch, 2.0));
            this.spawnParticles(this.letterTexts[this.typedIndex].x + this.wordContainer.x, this.letterTexts[this.typedIndex].y + this.wordContainer.y, 0x00ff00, 5);
            this.typedIndex++;
            this.currentCombo++;
            this.typedCharsThisLevel++;
            this.game.playerState.highestCombo = Math.max(this.game.playerState.highestCombo, this.currentCombo);
            AchievementSystem.onComboUpdate(this.currentCombo, this.showAchievementUnlock.bind(this));

            // Add score points for each correct letter
            this.game.playerState.score += Math.floor(10 * (1.0 + this.game.playerState.achievementScoreBonus));

            if (this.currentCombo === 5) this.showComboPopup("Good!", '#00aaff');
            else if (this.currentCombo === 10) this.showComboPopup("Great!\nATK+10%", '#aa00ff');
            else if (this.currentCombo === 15) this.showComboPopup("Excellent!\nATK+20%", '#ffaa00');
            else if (this.currentCombo === 20) this.showComboPopup("PERFECT!\nATK+50%", '#ff00ff');

            // Add orbit letter
            const orbitText = new Text({ text: expectedchar, style: new TextStyle({ fontFamily: 'Courier New', fontSize: 16, fill: '#00ffff', fontWeight: 'bold' }) });
            orbitText.anchor.set(0.5);
            this.container.addChild(orbitText);
            this.orbitGraphics.push(orbitText as any);

            if (this.typedIndex >= this.targetWord.length) {
                if (this.mode === 'Advanced' || this.mode === 'Intermediate' || this.mode === 'Beginner') this.resolveAdvancedTarget();
                else this.resolveCombat();
            }
        } else {
            // Incorrect
            this.errors++;
            this.levelErrors++;

            if (this.mode === 'Beginner' && this.targetQueue[this.targetQueueIndex]?.wordData) {
                const word = this.targetQueue[this.targetQueueIndex].text;
                this.game.playerState.errorWordStats[word] = (this.game.playerState.errorWordStats[word] || 0) + 1;
            }

            this.currentCombo = 0; // Reset combo
            this.comboScoreText.text = '';

            this.orbitGraphics.forEach(g => { if (!g.destroyed) { this.container.removeChild(g); g.destroy(); } });
            this.orbitGraphics = [];

            const t = this.letterTexts[this.typedIndex];
            t.style.fill = '#ff0000';
            AudioUtils.playDong();
            t.x += (Math.random() - 0.5) * 15; // Simple shake
            t.y += (Math.random() - 0.5) * 15;

            // Show hint of correct char briefly
            const originalText = t.text;
            t.text = expectedchar;

            setTimeout(() => {
                if (t && !t.destroyed && this.state === 'TYPING') {
                    t.style.fill = '#ffffff';
                    t.text = originalText;
                    this.renderWord(); // Reset position
                }
            }, 500);
        }
    }

    private showComboPopup(text: string, color: string) {
        this.comboScoreText.text = text;
        this.comboScoreText.style.fill = color;
        this.comboScoreText.scale.set(0.1);
        this.comboScoreText.alpha = 1;

        tweenManager.to({
            target: this.comboScoreText.scale,
            props: { x: 1.5, y: 1.5 },
            duration: 300,
            easing: Easing.easeOutBack,
            onComplete: () => {
                tweenManager.to({
                    target: this.comboScoreText.scale,
                    props: { x: 1, y: 1 },
                    duration: 200,
                    easing: Easing.easeInOutQuad
                });
            }
        });
    }



    private resolveCombat() {
        this.state = 'RESOLVING';

        const denominator = this.targetWord.length + this.errors;
        let accuracy = 0;

        if (this.typedIndex > 0) {
            if (this.mode === 'Beginner') {
                const effectiveErrors = Math.max(0, this.errors - 1);
                accuracy = this.typedIndex / (this.targetWord.length + effectiveErrors);
            } else if (this.mode === 'Intermediate') {
                const errorRate = this.errors / denominator;
                if (errorRate < 0.2 && this.typedIndex === this.targetWord.length) accuracy = 1.0;
                else accuracy = this.typedIndex / denominator;
            } else if (this.mode === 'Advanced') {
                accuracy = this.typedIndex / denominator;
            }
        }

        let atkMultiplier = 1;
        let feedback = "";
        let feedbackColor = '#ffffff';

        if (accuracy === 1) {
            atkMultiplier = 2.0; feedback = "PERFECT!"; feedbackColor = '#ffd700';
        } else if (accuracy >= 0.9) {
            atkMultiplier = 1.5; feedback = "GREAT!"; feedbackColor = '#c0c0c0';
        } else if (accuracy >= 0.8) {
            atkMultiplier = 1.25; feedback = "GOOD!"; feedbackColor = '#cd7f32';
        } else if (accuracy >= 0.5) {
            atkMultiplier = 1.0; feedback = "OK"; feedbackColor = '#ffffff';
        } else {
            atkMultiplier = 0.0; feedback = "KEEP TRYING!"; feedbackColor = '#cccccc';
        }

        const p = this.game.playerState;

        if (accuracy === 1 && p.perfectTimeBonus > 0) {
            this.timeLeft += p.perfectTimeBonus;
        }

        let comboMult = 1.0;
        comboMult += p.comboDamageBonusR;
        let comboBonusLogic = 0;
        if (this.currentCombo >= 20) comboBonusLogic = 0.5;
        else if (this.currentCombo >= 15) comboBonusLogic = 0.2;
        else if (this.currentCombo >= 10) comboBonusLogic = 0.1;
        comboMult += comboBonusLogic;

        if (this.currentCombo >= 3) comboMult *= p.combo3DamageMultiplier;
        if (this.currentCombo >= 5) comboMult *= p.combo5DamageMultiplier;

        const baseOutput = this.heroAtk * this.typedIndex * comboMult;
        let actualDamage = 0;
        let isCrit = false;

        if (this.typedIndex > 0) {
            let rawDamage = Math.floor(baseOutput * atkMultiplier);
            if (Math.random() < p.critChance) {
                rawDamage *= 2;
                isCrit = true;
                feedback += " [CRIT!]";
                feedbackColor = '#ff5555';
                if (isCrit) {
                    feedback += "CRIT! ";
                    actualDamage = Math.floor(actualDamage * (2.0 + (this.currentCombo >= 100 ? 1.0 : 0))); // Combo 100 achievement bonus
                    AchievementSystem.onCritTriggered(this.showAchievementUnlock.bind(this));
                }
            }
            actualDamage = Math.max(1, rawDamage - this.monsterDef);
        }

        let healAmount = 0;
        if (accuracy > 0.5) healAmount += this.heroHeal;

        this.feedbackText.text = `${feedback}`;
        this.feedbackText.style.fill = feedbackColor;

        const executeHeroAttack = () => {
            if (this.typedIndex === 0) {
                if (healAmount > 0) {
                    this.heroHp = Math.min(this.heroMaxHp, this.heroHp + healAmount);
                    this.showDamageNumber(this.heroSprite.x, this.heroSprite.y - 20, "+" + healAmount, '#00ff00');
                    this.updateUI();
                }
                setTimeout(() => this.executeMonsterCounter(), 500);
                return;
            }

            // Charge up
            tweenManager.to({
                target: this.heroSprite.scale,
                props: { x: 1.2, y: 0.8 },
                duration: 200,
                easing: Easing.easeOutQuad,
                onComplete: () => {
                    // Dash forward
                    tweenManager.to({
                        target: this.heroSprite,
                        props: { x: this.heroSprite.x + 40 },
                        duration: 100,
                        easing: Easing.easeInQuad,
                        onComplete: () => {
                            if (accuracy === 1) {
                                // Meteor Strike effect for Perfect
                                const meteor = new Graphics();
                                meteor.circle(0, 0, 15).fill({ color: 0xff4400 }).stroke({ color: 0xffff00, width: 3 });
                                meteor.x = this.monsterSprite.x + 150;
                                meteor.y = this.monsterSprite.y - 200;
                                this.container.addChild(meteor);

                                tweenManager.to({
                                    target: meteor,
                                    props: { x: this.monsterSprite.x, y: this.monsterSprite.y },
                                    duration: 200, // Faster meteor
                                    easing: Easing.easeInQuad,
                                    onComplete: () => {
                                        this.container.removeChild(meteor);
                                        meteor.destroy();
                                        AudioUtils.playExplosion();
                                        this.spawnParticles(this.monsterSprite.x, this.monsterSprite.y, 0xff4400, 40);
                                    }
                                });
                            }

                            // Slash projectile (hero-type specific)
                            HeroFactory.createAttackEffect(this.game.playerState.heroType, this.container, this.heroSprite, this.monsterSprite.x, this.monsterSprite.y, this.currentCombo);

                            // Delay damage to sync with HeroFactory's projectile
                            setTimeout(() => {
                                this.monsterHp -= actualDamage;
                                AudioUtils.playExplosion();
                                this.spawnParticles(this.monsterSprite.x + 40, this.monsterSprite.y + 40, isCrit ? 0xff5555 : 0xffaa00, accuracy === 1 ? 50 : 30);

                                this.showDamageNumber(this.monsterSprite.x + 40 + (Math.random() * 20 - 10), this.monsterSprite.y + (Math.random() * 20 - 10), actualDamage, isCrit ? '#ff0000' : '#ffffff');

                                if (healAmount > 0) {
                                    this.heroHp = Math.min(this.heroMaxHp, this.heroHp + healAmount);
                                    this.showDamageNumber(this.heroSprite.x, this.heroSprite.y - 20, "+" + healAmount, '#00ff00');
                                }
                                this.updateUI();

                                // Monster Shake
                                const mx = this.monsterSprite.x;
                                tweenManager.to({
                                    target: this.monsterSprite, props: { x: mx + 15 }, duration: 50, onComplete: () => {
                                        tweenManager.to({
                                            target: this.monsterSprite, props: { x: mx - 15 }, duration: 50, onComplete: () => {
                                                tweenManager.to({ target: this.monsterSprite, props: { x: mx }, duration: 50 });
                                            }
                                        });
                                    }
                                });

                                // Hero returns 
                                tweenManager.to({
                                    target: this.heroSprite,
                                    props: { x: this.heroSprite.x - 40 },
                                    duration: 300,
                                    easing: Easing.easeOutQuad,
                                    onComplete: () => {
                                        this.heroSprite.scale.set(1);
                                        setTimeout(() => this.executeMonsterCounter(), 500);
                                    }
                                });
                            }, 200);
                        }
                    });
                }
            });
        };

        executeHeroAttack();
    }

    private resolveAdvancedTarget() {
        this.state = 'RESOLVING';
        const item = this.targetQueue[this.targetQueueIndex];
        const p = this.game.playerState;

        AchievementSystem.onWordTyped(item.text, this.showAchievementUnlock.bind(this));

        // Base Damage calculation
        let lengthMultiplier = 1;
        if (item.text.length >= 7) lengthMultiplier = 3;
        else if (item.text.length >= 5) lengthMultiplier = 2.5;
        else if (item.text.length >= 3) lengthMultiplier = 2;

        const baseOutput = item.text.length * lengthMultiplier;

        // Apply existing Buffs to THIS attack first
        let atkMult = 1.0 + this.levelBuffs.atkBonus;
        if (this.levelBuffs.berserkActive) {
            atkMult += 0.5;
            this.levelBuffs.berserkActive = false; // consume it for this attack
        }

        // Category Buffs from the newly typed word for the *future*
        let healAmount = 0;
        let buffPopup = "";

        if (item.wordData) {
            const cat = item.wordData.categoryZh;
            if (cat.includes('衣服') || cat.includes('配件')) {
                this.levelBuffs.defBonus = Math.min(0.5, this.levelBuffs.defBonus + 0.1);
                buffPopup = "DEF UP!";
            } else if (cat.includes('食物') || cat.includes('飲料')) {
                this.levelBuffs.atkBonus = Math.min(0.75, this.levelBuffs.atkBonus + 0.15);
                buffPopup = "ATK UP!";
            } else if (cat.includes('時間')) {
                this.timeLeft = Math.min(this.timeLimit + 5, this.timeLeft + 1); // User specs: +1 sec per word max 5s total buffer
                buffPopup = "+1 SEC";
            } else if (cat.includes('學校')) {
                healAmount = this.heroHeal * item.text.length * 3;
                buffPopup = "HEAL!";
            } else if (cat.includes('動物') || cat.includes('昆蟲')) {
                this.levelBuffs.berserkActive = true;
                buffPopup = "BERSERK!";
            } else if (cat.includes('天氣') || cat.includes('自然')) {
                this.levelBuffs.regenTurnsRemaining = 3; // Refreshes regen duration
                buffPopup = "REGEN!";
            }
        }

        // Apply Combo Modifiers
        let comboMult = 1.0;
        comboMult += p.comboDamageBonusR;
        if (this.currentCombo >= 20) comboMult += 0.5;
        else if (this.currentCombo >= 15) comboMult += 0.2;
        else if (this.currentCombo >= 10) comboMult += 0.1;
        if (this.currentCombo >= 3) comboMult *= p.combo3DamageMultiplier;
        if (this.currentCombo >= 5) comboMult *= p.combo5DamageMultiplier;

        let weightBonus = 1.0;
        if (this.mode === 'Beginner' && p.errorWordStats[item.text] > 0) {
            weightBonus = 1.5; // Build up high damage for difficult words
            buffPopup = (buffPopup ? buffPopup + " " : "") + "POWER UP!";
        }

        let rawDamage = Math.floor(baseOutput * this.heroAtk * comboMult * atkMult * weightBonus);
        let isCrit = false;
        if (Math.random() < p.critChance) {
            rawDamage *= 2;
            isCrit = true;
        }

        let actualDamage = Math.max(1, rawDamage - this.monsterDef);

        // Execute Hero Attack sequentially for Advanced Mode
        this.executeAdvancedHeroAttack(actualDamage, healAmount, isCrit, buffPopup);
    }

    private executeAdvancedHeroAttack(actualDamage: number, healAmount: number, isCrit: boolean, buffPopup: string) {
        if (buffPopup) {
            this.showDamageNumber(this.heroSprite.x, this.heroSprite.y - 40, buffPopup, '#ffff00');
        }

        // Charge up
        tweenManager.to({
            target: this.heroSprite.scale,
            props: { x: 1.2, y: 0.8 },
            duration: 100,
            easing: Easing.easeOutQuad,
            onComplete: () => {
                // Dash forward
                tweenManager.to({
                    target: this.heroSprite,
                    props: { x: this.heroSprite.x + 20 },
                    duration: 50,
                    easing: Easing.easeInQuad,
                    onComplete: () => {
                        // Add attack effect (hero-type specific)
                        HeroFactory.createAttackEffect(this.game.playerState.heroType, this.container, this.heroSprite, this.monsterSprite.x, this.monsterSprite.y, this.currentCombo);

                        // Delay the damage application slightly to sync with the slash effect
                        setTimeout(() => {
                            this.monsterHp -= actualDamage;
                            if (this.monsterHp < 0) this.monsterHp = 0;

                            AudioUtils.playExplosion();
                            this.spawnParticles(this.monsterSprite.x + 40, this.monsterSprite.y + 40, isCrit ? 0xff5555 : 0xffaa00, 20);
                            this.showDamageNumber(this.monsterSprite.x + 40 + (Math.random() * 20 - 10), this.monsterSprite.y + (Math.random() * 20 - 10), actualDamage, isCrit ? '#ff0000' : '#ffffff');

                            if (healAmount > 0) {
                                this.heroHp = Math.min(this.heroMaxHp, this.heroHp + healAmount);
                                this.showDamageNumber(this.heroSprite.x, this.heroSprite.y - 20, "+" + healAmount, '#00ff00');
                            }
                            this.updateUI();

                            // Monster Shake
                            const mx = this.monsterSprite.x;
                            tweenManager.to({
                                target: this.monsterSprite, props: { x: mx + 15 }, duration: 50, onComplete: () => {
                                    tweenManager.to({
                                        target: this.monsterSprite, props: { x: mx - 15 }, duration: 50, onComplete: () => {
                                            tweenManager.to({ target: this.monsterSprite, props: { x: mx }, duration: 50 });
                                        }
                                    });
                                }
                            });

                            // Hero returns
                            tweenManager.to({
                                target: this.heroSprite,
                                props: { x: this.heroSprite.x - 20 },
                                duration: 150,
                                easing: Easing.easeOutQuad,
                                onComplete: () => {
                                    this.heroSprite.scale.set(1);

                                    if (this.monsterHp <= 0) {
                                        setTimeout(() => this.executeVictory(), 500);
                                        return;
                                    }

                                    // Advance Queue
                                    this.targetQueueIndex++;
                                    if (this.targetQueueIndex >= this.targetQueue.length) {
                                        this.renderWord(); // Re-render to show completion of all

                                        // Meteor Strike Logic (Completed all 5 words)
                                        setTimeout(() => {
                                            this.showDamageNumber(this.heroSprite.x, this.heroSprite.y - 40, "METEOR STRIKE!", '#ffaa00');
                                            AudioUtils.playExplosion();

                                            // Create a makeshift meteor
                                            const meteor = new Graphics();
                                            meteor.circle(0, 0, 15).fill({ color: 0xff4400 }).stroke({ color: 0xffff00, width: 3 });
                                            meteor.x = this.monsterSprite.x + 150;
                                            meteor.y = this.monsterSprite.y - 200;
                                            this.container.addChild(meteor);

                                            tweenManager.to({
                                                target: meteor,
                                                props: { x: this.monsterSprite.x + 40, y: this.monsterSprite.y + 40 },
                                                duration: 300,
                                                easing: Easing.easeInQuad,
                                                onComplete: () => {
                                                    this.container.removeChild(meteor);
                                                    meteor.destroy();
                                                    AudioUtils.playExplosion();

                                                    // Halve monster HP
                                                    const meteorDmg = Math.floor(this.monsterHp / 2);
                                                    this.monsterHp -= meteorDmg;

                                                    this.spawnParticles(this.monsterSprite.x + 40, this.monsterSprite.y + 40, 0xff0000, 40);
                                                    this.showDamageNumber(this.monsterSprite.x + 40, this.monsterSprite.y, meteorDmg, '#ff00ff');
                                                    this.updateUI();

                                                    // Screen Shake (Strong)
                                                    const mShake = 20;
                                                    tweenManager.to({
                                                        target: this.container, props: { x: -mShake }, duration: 50, onComplete: () => {
                                                            tweenManager.to({
                                                                target: this.container, props: { x: mShake }, duration: 50, onComplete: () => {
                                                                    tweenManager.to({ target: this.container, props: { x: 0 }, duration: 50 });
                                                                }
                                                            });
                                                        }
                                                    });

                                                    if (this.monsterHp <= 0) {
                                                        setTimeout(() => this.executeVictory(), 500);
                                                    } else {
                                                        setTimeout(() => this.resolveAdvancedTurnEnd(), 600);
                                                    }
                                                }
                                            });
                                        }, 300);

                                    } else {
                                        this.targetWord = this.targetQueue[this.targetQueueIndex].text;
                                        this.typedIndex = 0;
                                        this.renderWord(); // Update active highlights
                                        this.state = 'TYPING';
                                    }
                                }
                            });
                        }, 100); // Delay damage by 100ms to sync with slash effect
                    }
                });
            }
        });
    }

    private resolveAdvancedTurnEnd() {
        this.state = 'RESOLVING';

        if (this.monsterHp <= 0) return;

        // Time Bonus Damage logic
        if (this.timeLeft > 0 && (this.mode === 'Advanced' || this.mode === 'Intermediate')) {
            const timeBonusDmg = Math.floor(this.timeLeft * this.heroAtk * 2);
            if (timeBonusDmg > 0) {
                this.monsterHp -= timeBonusDmg;
                if (this.monsterHp < 0) this.monsterHp = 0;
                this.showDamageNumber(this.monsterSprite.x + 40, this.monsterSprite.y - 20, `TIME BONUS! ${timeBonusDmg}`, '#00ffff');
                this.spawnParticles(this.monsterSprite.x + 40, this.monsterSprite.y + 40, 0x00ffff, 20);
                this.updateUI();
            }
            this.timeLeft = 0; // Consume the time
        }

        // Apply Natural Regen from buff
        if (this.levelBuffs.regenTurnsRemaining > 0) {
            this.levelBuffs.regenTurnsRemaining--;
            const amount = Math.floor(this.heroMaxHp * 0.05);
            this.heroHp = Math.min(this.heroMaxHp, this.heroHp + amount);
            this.showDamageNumber(this.heroSprite.x, this.heroSprite.y - 20, "+" + amount + " (REGEN)", '#00ff00');
            this.updateUI();
        }

        setTimeout(() => this.executeMonsterCounter(), 500);
    }

    private executeMonsterCounter() {
        if (this.monsterHp <= 0) {
            this.executeVictory();
            return;
        }

        this.state = 'RESOLVING';

        // Monster Attack Animation
        tweenManager.to({
            target: this.monsterSprite.scale,
            props: { x: 1.1, y: 0.9 },
            duration: 200,
            easing: Easing.easeOutQuad,
            onComplete: () => {
                tweenManager.to({
                    target: this.monsterSprite,
                    props: { x: this.monsterSprite.x - 20 },
                    duration: 100,
                    easing: Easing.easeInQuad,
                    onComplete: () => {
                        // Monster projectile
                        this.createSlimeProjectileEffect(this.heroSprite.x, this.heroSprite.y);

                        // Calculate monster damage
                        let monsterDamage = Math.max(1, this.monsterAtk - this.heroDef * (1 + this.levelBuffs.defBonus));
                        if (this.levelBuffs.berserkActive) {
                            monsterDamage *= 1.2; // Berserk makes you take more damage
                        }
                        monsterDamage = Math.floor(monsterDamage);

                        // Delay damage application to sync with projectile
                        setTimeout(() => {
                            this.heroHp -= monsterDamage;
                            this.tookDamageThisLevel = true;
                            if (this.heroHp < 0) this.heroHp = 0;

                            AudioUtils.playHit();
                            this.spawnParticles(this.heroSprite.x, this.heroSprite.y, 0xff0000, 20);
                            this.showDamageNumber(this.heroSprite.x + (Math.random() * 20 - 10), this.heroSprite.y - 20 + (Math.random() * 20 - 10), monsterDamage, '#ff0000');
                            this.updateUI();

                            // Hero Shake
                            const hx = this.heroSprite.x;
                            tweenManager.to({
                                target: this.heroSprite, props: { x: hx - 10 }, duration: 50, onComplete: () => {
                                    tweenManager.to({
                                        target: this.heroSprite, props: { x: hx + 10 }, duration: 50, onComplete: () => {
                                            tweenManager.to({ target: this.heroSprite, props: { x: hx }, duration: 50 });
                                        }
                                    });
                                }
                            });

                            // Monster returns
                            tweenManager.to({
                                target: this.monsterSprite,
                                props: { x: this.monsterSprite.x + 20 },
                                duration: 150,
                                easing: Easing.easeOutQuad,
                                onComplete: () => {
                                    this.monsterSprite.scale.set(1);

                                    if (this.heroHp <= 0) {
                                        setTimeout(() => this.executeGameOver(), 500);
                                    } else {
                                        // Auto refresh turn
                                        this.startTurn();
                                    }
                                }
                            });
                        }, 300); // Delay damage by 300ms to sync with projectile effect
                    }
                });
            }
        });
    }

    private executeVictory() {
        this.monsterHp = 0;
        this.heroHp = Math.min(this.heroMaxHp, this.heroHp + this.heroHeal); // Full clear        

        const accuracy = this.levelErrors === 0 ? 1.0 : 0.0;
        AchievementSystem.onLevelComplete(this.mode, accuracy, this.usedReviveThisLevel, this.tookDamageThisLevel, this.showAchievementUnlock.bind(this));

        // Calculate gold reward
        let goldReward = this.level * 10;
        if (accuracy >= 1.0) goldReward = Math.floor(goldReward * 1.2);
        const goldBonus = this.game.playerState.achievementGoldBonus;
        goldReward = Math.floor(goldReward * (1.0 + goldBonus));

        this.game.playerState.gold += goldReward;
        AchievementSystem.onGoldEarned(goldReward, this.showAchievementUnlock.bind(this));

        // Update lifetime stats (chars and time)
        const timeSpent = Date.now() - this.startTimeThisLevel;
        AchievementSystem.onStatsUpdate(this.typedCharsThisLevel, timeSpent, this.showAchievementUnlock.bind(this));

        // Save progress right after victory (LocalStorage Cache)
        this.game.playerState.saveToStorage(this.level, this.mode, this.heroHp, 0);

        // Sync to Cloud
        CloudSave.saveProgress({
            level: this.level,
            mode: this.mode,
            currentHp: this.heroHp,
            hpBase: this.game.playerState.hpBase,
            score: this.game.playerState.score,
            gold: this.game.playerState.gold,
            highestCombo: this.game.playerState.highestCombo,
            inventory: this.game.playerState.inventory,
            heroType: this.game.playerState.heroType,
            characterTint: this.game.playerState.characterTint,
            errorWordStats: this.game.playerState.errorWordStats,
            shopPurchases: this.game.playerState.shopPurchases,
            consumables: this.game.playerState.consumables,
            goldBoostPerm: this.game.playerState.goldBoostPerm,
            scoreBoostPerm: this.game.playerState.scoreBoostPerm,
            ssrDropBoost: this.game.playerState.ssrDropBoost,
            cosmetics: this.game.playerState.cosmetics,
            enhanceLevels: this.game.playerState.enhanceLevels,
        });

        CloudSave.reportMatchResult({
            mode: this.mode,
            level: this.level,
            score: this.game.playerState.score,
            goldEarned: goldReward,
            maxCombo: this.game.playerState.highestCombo,
            won: true
        });

        this.feedbackText.text = "LEVEL CLEARED!";
        this.feedbackText.style.fill = '#00ff00';
        this.updateUI();

        // Monster Fade out
        tweenManager.to({
            target: this.monsterSprite,
            props: { y: this.monsterSprite.y + 50, alpha: 0 },
            duration: 1000,
            easing: Easing.easeInQuad
        });

        // Spawn wealth particles
        for (let i = 0; i < 30; i++) {
            this.spawnParticles(this.monsterSprite.x + 40, this.monsterSprite.y + 40, 0xffd700, 1);
        }

        // Hero Jump
        const hy = this.heroSprite.y;
        tweenManager.to({
            target: this.heroSprite, props: { y: hy - 50 }, duration: 250, easing: Easing.easeOutQuad, onComplete: () => {
                tweenManager.to({
                    target: this.heroSprite, props: { y: hy }, duration: 250, easing: Easing.easeInQuad, onComplete: () => {
                        tweenManager.to({
                            target: this.heroSprite, props: { y: hy - 50 }, duration: 250, easing: Easing.easeOutQuad, onComplete: () => {
                                tweenManager.to({
                                    target: this.heroSprite, props: { y: hy }, duration: 250, easing: Easing.easeInQuad, onComplete: () => {
                                        this.game.scenes.switchTo('reward');
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    public update(delta: number) {
        if (this.isPaused) {
            return;
        }
        const deltaMs = delta * (1000 / 60);
        tweenManager.update(deltaMs);

        if (this.state === 'TYPING') {
            if (this.mode !== 'Beginner') {
                this.timeLeft -= (delta / 60);
            }

            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                if (this.mode === 'Advanced' || this.mode === 'Intermediate') this.resolveAdvancedTurnEnd();
                else this.resolveCombat();
            }

            // Render Timer
            this.timerGraphics.clear();
            this.timerGraphics.rect(0, 0, 400, 20).fill({ color: 0x333333 });

            const ratio = this.timeLeft / this.timeLimit;
            this.timerGraphics.rect(0, 0, 400 * ratio, 20).fill({ color: ratio > 0.3 ? 0x00ff00 : 0xff0000 });

            // Spin orbits
            this.orbitGraphics.forEach((g, i) => {
                const angle = (Date.now() / 300) + (i * Math.PI * 2 / this.orbitGraphics.length);
                g.x = this.heroSprite.x + 30 + Math.cos(angle) * 40;
                g.y = this.heroSprite.y + 30 + Math.sin(angle) * 40;
            });
        } else if (this.state === 'GAME_OVER') {
            // idle
        }

        this.updateParticles(delta);
    }

    public exit() {
        this.hidePauseOverlay();
        this.container.removeChildren();
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('pointerdown', this.handlePointerDown);

        if (this.mobileInput) {
            this.mobileInput.removeEventListener('input', this.handleMobileInput);
            document.body.removeChild(this.mobileInput);
            this.mobileInput = null;
        }

        tweenManager.clear();
        this.orbitGraphics.forEach(g => g.destroy());
        this.orbitGraphics = [];
    }

    private updateUI() {
        this.levelText.text = `Level ${this.level}`;
        this.heroHpText.text = `Hero HP: ${this.heroHp}/${this.heroMaxHp}`;
        this.monsterHpText.text = `Monster HP: ${this.monsterHp}/${this.monsterMaxHp}`;
    }

    private spawnParticles(x: number, y: number, color: number, count: number) {
        for (let i = 0; i < count; i++) {
            const p = new Graphics();
            p.rect(0, 0, 4, 4).fill({ color });
            p.x = x;
            p.y = y;
            this.container.addChild(p);

            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.particles.push({
                graphics: p,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                maxLife: Math.random() * 0.5 + 0.5
            });
        }
    }

    private updateParticles(delta: number) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.graphics.x += p.vx * delta;
            p.graphics.y += p.vy * delta;
            p.life -= (delta / 60); // assuming 60fps roughly
            p.graphics.alpha = Math.max(0, p.life / p.maxLife);

            if (p.life <= 0) {
                this.container.removeChild(p.graphics);
                p.graphics.destroy();
                this.particles.splice(i, 1);
            }
        }
    }

    private showDamageNumber(x: number, y: number, damage: number | string, customColor: string = '#ff0000') {
        const dmgText = new Text({
            text: typeof damage === 'number' && damage > 0 ? `-${damage}` : `${damage}`,
            style: new TextStyle({
                fontFamily: 'Courier New',
                fontSize: 32,
                fill: customColor,
                fontWeight: 'bold',
                dropShadow: { color: 0x000000, alpha: 1, distance: 2 }
            })
        });
        dmgText.x = x;
        dmgText.y = y;
        dmgText.anchor.set(0.5);
        this.container.addChild(dmgText);

        let elapsed = 0;
        const animate = () => {
            elapsed += Ticker.shared.deltaMS;
            dmgText.y -= 2; // Float up
            dmgText.alpha = 1 - (elapsed / 1000); // Fade out over 1 sec

            if (elapsed > 1000) {
                Ticker.shared.remove(animate);
                if (!dmgText.destroyed) {
                    this.container.removeChild(dmgText);
                    dmgText.destroy();
                }
            }
        };
        Ticker.shared.add(animate);
    }


    private drawMonster(): Graphics {
        const g = new Graphics();
        const pSize = 3;
        const bodyBase = this.level > 10 ? 0xff4444 : 0x44ff44;
        const darkBody = this.level > 10 ? 0xaa0000 : 0x00aa00;
        const lightBody = this.level > 10 ? 0xff8888 : 0x88ff88;
        const outlineColor = this.level > 10 ? 0x660000 : 0x006600;
        const accentColor = this.level > 15 ? 0xff00ff : 0xffff00;

        const colors = [
            0x000000, outlineColor, bodyBase, 0xffffff, 0x000000,
            darkBody, lightBody, accentColor, 0x99ff99, 0xff9999,
            0x77aa77, 0xaa7777
        ];

        const secondaryHighlight = this.level > 10 ? 9 : 8;
        const slimeTexture = this.level > 10 ? 11 : 10;

        const art = [
            [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0, 0],
            [0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0],
            [0, 0, 1, 2, 2, 2, 6, 6, 2, 2, 2, 2, 6, 6, 2, 2, 2, 1, 0, 0],
            [0, 0, 1, 2, 2, 2, 6, 6, 2, 2, 2, 2, 6, 6, 2, 2, 2, 1, 0, 0],
            [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
            [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
            [1, 2, 2, 2, 2, 3, 3, 3, 4, 2, 2, 3, 3, 3, 4, 2, 2, 2, 2, 1],
            [1, 2, 2, 2, 2, 3, 3, 3, 2, 7, 7, 2, 3, 3, 2, 2, 2, 2, 2, 1],
            [1, 2, 2, 2, 2, 2, 3, 2, 7, 7, 7, 7, 2, 2, 2, 2, 2, 2, 2, 1],
            [1, 2, 2, 2, 6, 6, 2, 7, 7, 7, 7, 7, 7, 2, 6, 6, 2, 2, 2, 1],
            [1, 2, 2, 2, secondaryHighlight, 6, 2, 2, 7, 7, 7, 7, 2, 2, secondaryHighlight, 6, 2, 2, 2, 1],
            [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
            [1, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 5, 5, 1],
            [1, 5, 5, 5, 2, 2, 2, slimeTexture, slimeTexture, 2, 2, slimeTexture, slimeTexture, 2, 2, 2, 5, 5, 5, 1],
            [0, 1, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 1, 0],
            [0, 1, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 1, 0],
            [0, 0, 1, 1, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 1, 1, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0]
        ];

        for (let r = 0; r < art.length; r++) {
            for (let c = 0; c < art[r].length; c++) {
                const px = art[r][c];
                if (px !== 0) {
                    g.rect(c * pSize, r * pSize, pSize, pSize).fill({ color: colors[px] });
                }
            }
        }

        this.createSlimeSpecialEffects(g, pSize, colors[7], colors[2]);
        this.createSlimeJiggleEffect(g, pSize, art.length);

        g.rect(3 * pSize, art.length * pSize, (art[0].length - 6) * pSize, pSize)
            .fill({ color: 0x000000, alpha: 0.4 });

        return g;
    }



    private createSlimeSpecialEffects(g: Graphics, pSize: number, accentColor: number, bodyColor: number): void {
        const core = new Graphics();
        const centerX = 10 * pSize;
        const centerY = 11 * pSize;
        const animate = () => {
            if (core.destroyed) { Ticker.shared.remove(animate); return; }
            core.clear();
            const time = Date.now() / 1000;
            const pulse = 1 + Math.sin(time * 3) * 0.2;
            for (let i = 3; i >= 0; i--) core.circle(centerX, centerY, (1 + i) * pSize * pulse).fill({ color: accentColor, alpha: 0.3 * (1 - i / 3) * pulse });
            core.rect(centerX - pSize / 2, centerY - pSize / 2, pSize, pSize).fill({ color: bodyColor, alpha: 0.8 }); // Use bodyColor as base
            core.rect(centerX - pSize / 2, centerY - pSize / 2, pSize, pSize).fill({ color: accentColor, alpha: 0.9 });
        };
        g.addChild(core);
        Ticker.shared.add(animate);
    }

    private createSlimeJiggleEffect(g: Graphics, pSize: number, height: number): void {
        const animate = () => {
            if (g.destroyed) { Ticker.shared.remove(animate); return; }
            const time = Date.now() / 1000;
            g.scale.x = 1 + Math.sin(time * 2) * 0.04;
            g.scale.y = 1 - Math.sin(time * 2) * 0.03;
            g.y = this.game.app.screen.height * 0.616 + (1 - g.scale.y) * height * pSize;
        };
        Ticker.shared.add(animate);
    }



    private createSlimeProjectileEffect(targetX: number, targetY: number): void {
        const ball = new Graphics();
        ball.ellipse(0, 0, 10, 8).fill({ color: this.level > 10 ? 0xff4444 : 0x44ff44 }).stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
        this.container.addChild(ball);
        const startX = this.monsterSprite.x;
        const startY = this.monsterSprite.y;
        const startTime = Date.now();
        const animate = () => {
            const progress = (Date.now() - startTime) / 600;
            if (progress >= 1 || ball.destroyed) {
                Ticker.shared.remove(animate);
                if (!ball.destroyed) {
                    this.createSlimeImpactEffect(targetX, targetY);
                    ball.destroy();
                }
                return;
            }
            const arc = Math.sin(progress * Math.PI) * 100;
            ball.x = startX + (targetX - startX) * progress;
            ball.y = startY + (targetY - startY) * progress - arc;
            ball.rotation = progress * Math.PI * 4;
        };
        Ticker.shared.add(animate);
    }

    private createSlimeImpactEffect(x: number, y: number): void {
        const impact = new Graphics();
        this.container.addChild(impact);
        const startTime = Date.now();
        const color = this.level > 10 ? 0xff4444 : 0x44ff44;
        const animate = () => {
            const p = (Date.now() - startTime) / 500;
            if (p >= 1 || impact.destroyed) { Ticker.shared.remove(animate); if (!impact.destroyed) impact.destroy(); return; }
            impact.clear();
            impact.circle(x, y, p * 50).stroke({ width: (1 - p) * 4, color, alpha: 1 - p });
        };
        Ticker.shared.add(animate);
    }

    private executeGameOver() {
        const p = this.game.playerState;
        this.state = 'GAME_OVER';
        this.feedbackText.text = "GAME OVER";
        this.feedbackText.style.fill = '#ff0000';
        this.updateUI();

        // Clear save on death
        import('../PlayerState').then(m => m.PlayerState.clearStorage());

        if (typeof CloudSave !== 'undefined') {
            CloudSave.reportMatchResult({
                mode: this.mode,
                level: this.level,
                score: p.score,
                maxCombo: p.highestCombo,
                won: false
            });
        }

        const acc = this.levelErrors === 0 ? 1.0 : 0.0;
        LeaderboardSystem.saveRun({
            date: new Date().toLocaleDateString(),
            level: this.level,
            accuracy: acc,
            mode: this.mode,
            playTime: 0,
            typedCount: p.score
        });

        setTimeout(() => {
            this.game.scenes.switchTo('gameover', { mode: this.mode, level: this.level, accuracy: acc });
        }, 1500);
    }



    private animateCharacters() {
        // Simple float for hero
        if (this.heroSprite) {
            const oy = this.heroSprite.y;
            tweenManager.to({
                target: this.heroSprite, props: { y: oy - 5 }, duration: 1500, easing: Easing.easeInOutQuad, onComplete: () => {
                    tweenManager.to({ target: this.heroSprite, props: { y: oy }, duration: 1500, easing: Easing.easeInOutQuad, onComplete: () => this.animateCharacters() });
                }
            });
        }
    }

    private showAchievementUnlock(ach: AchievementDef) {
        const AudioUtils = (window as any).AudioUtils || { playDing: () => { } }; // Just in case, actually it's a class at top of file. Well I can just reference it directly since it's in scope. Oh right I should just use the class

        // The real AudioUtils class is in the same file
        try {
            // @ts-ignore
            AudioUtils.playDing(1.5);
        } catch (e) { }

        const banner = new Container();
        banner.y = -100;
        banner.x = 400;

        const bg = new Graphics();
        bg.rect(-200, -40, 400, 80).fill({ color: 0x222222, alpha: 0.9 }).stroke({ width: 2, color: 0xffd700 });
        banner.addChild(bg);

        const icon = new Text({ text: ach.icon, style: new TextStyle({ fontSize: 40 }) });
        icon.anchor.set(0.5);
        icon.x = -150;
        banner.addChild(icon);

        const title = new Text({ text: "Achievement Unlocked!", style: new TextStyle({ fontFamily: 'Courier New', fontSize: 16, fill: '#ffd700', fontWeight: 'bold' }) });
        title.anchor.set(0.5, 1);
        title.y = -15;
        banner.addChild(title);

        const name = new Text({ text: ach.title, style: new TextStyle({ fontFamily: '"Microsoft JhengHei", Arial', fontSize: 20, fill: '#ffffff' }) });
        name.anchor.set(0.5, 0);
        name.y = 5;
        banner.addChild(name);

        this.container.addChild(banner);

        tweenManager.to({
            target: banner, props: { y: 100 }, duration: 500, easing: Easing.easeOutBack, onComplete: () => {
                setTimeout(() => {
                    tweenManager.to({
                        target: banner, props: { y: -100 }, duration: 500, easing: Easing.easeInQuad, onComplete: () => {
                            this.container.removeChild(banner);
                            banner.destroy({ children: true });
                        }
                    });
                }, 3000);
            }
        });
    }

    private togglePause() {
        if (this.state === 'GAME_OVER') return;

        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.showPauseOverlay();
        } else {
            this.hidePauseOverlay();
        }
    }

    private showPauseOverlay() {
        if (this.pauseOverlay) return;

        this.renderPauseOverlay();
    }

    private renderPauseOverlay() {
        if (this.pauseOverlay) {
            this.container.removeChild(this.pauseOverlay);
            this.pauseOverlay.destroy({ children: true });
        }

        const sw = this.game.app.screen.width;
        const sh = this.game.app.screen.height;

        this.pauseOverlay = new Container();

        const bg = new Graphics();
        bg.rect(0, 0, sw, sh).fill({ color: 0x000000, alpha: 0.6 });
        this.pauseOverlay.addChild(bg);

        const txt = new Text({
            text: 'PAUSED\nPress ESC to Resume',
            style: new TextStyle({
                fontFamily: 'Courier New',
                fontSize: 48,
                fill: '#ffffff',
                align: 'center',
                dropShadow: { color: 0x000000, alpha: 0.8, distance: 4 }
            })
        });
        txt.anchor.set(0.5);
        txt.x = sw / 2;
        txt.y = sh / 2;
        this.pauseOverlay.addChild(txt);

        const menuTxt = new Text({
            text: 'Press M to Return to Menu',
            style: new TextStyle({
                fontFamily: 'Courier New',
                fontSize: 24,
                fill: '#aaaaaa',
                align: 'center'
            })
        });
        menuTxt.anchor.set(0.5);
        menuTxt.x = sw / 2;
        menuTxt.y = sh / 2 + 80;
        menuTxt.interactive = true;
        menuTxt.cursor = 'pointer';
        menuTxt.on('pointertap', () => {
            this.game.scenes.switchTo('menu');
        });
        this.pauseOverlay.addChild(menuTxt);

        this.container.addChild(this.pauseOverlay);
    }

    private hidePauseOverlay() {
        if (this.pauseOverlay) {
            this.container.removeChild(this.pauseOverlay);
            this.pauseOverlay.destroy({ children: true });
            this.pauseOverlay = null;
        }
    }

    public onResize(width: number, height: number): void {
        if (this.heroSprite) {
            this.heroSprite.x = width * 0.1875;
            this.heroSprite.y = height * 0.666;
        }
        if (this.monsterSprite) {
            this.monsterSprite.x = width * 0.6875;
            this.monsterSprite.y = height * 0.616;
        }
        if (this.heroHpText) this.heroHpText.y = height - 20;
        if (this.monsterHpText) {
            this.monsterHpText.x = width - 20;
            this.monsterHpText.y = height - 20;
        }
        if (this.wordContainer) {
            this.wordContainer.x = width / 2;
            this.wordContainer.y = height * 0.416;
        }
        if (this.timerGraphics) {
            this.timerGraphics.x = width / 2 - 200;
            this.timerGraphics.y = height / 2;
        }
        if (this.feedbackText) {
            this.feedbackText.x = width / 2;
            this.feedbackText.y = height * 0.25;
        }
        if (this.comboContainer) {
            this.comboContainer.x = width / 2;
            this.comboContainer.y = height * 0.166;
        }
        if (this.flashOverlay) {
            this.flashOverlay.clear().rect(0, 0, width, height).fill({ color: 0xffffff });
        }
        if (this.pauseOverlay) {
            this.renderPauseOverlay(); // Redraw overlay
        }
    }

    private getWeightedWord(): any {
        const p = this.game.playerState;
        // Simple weighting: words with errors get a much higher chance
        // We'll pick a pool of candidates (e.g., 20) and then pick one with bias
        const candidates: any[] = [];
        for (let i = 0; i < 20; i++) {
            const word = VOCABULARY[Math.floor(Math.random() * VOCABULARY.length)];
            candidates.push(word);
        }

        // Add some "known difficult" words if they exist
        const difficultWords = Object.keys(p.errorWordStats).filter(w => p.errorWordStats[w] > 0);
        if (difficultWords.length > 0) {
            for (let i = 0; i < 5; i++) {
                const dw = difficultWords[Math.floor(Math.random() * difficultWords.length)];
                const wordData = VOCABULARY.find(v => v.word.toLowerCase() === dw.toLowerCase());
                if (wordData) candidates.push(wordData);
            }
        }

        return candidates[Math.floor(Math.random() * candidates.length)];
    }
}
