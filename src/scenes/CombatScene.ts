import { Text, TextStyle, Container, Graphics, Ticker } from 'pixi.js';
import { Scene } from './Scene';
import { CloudSave } from '../utils/CloudSave';
import { ITEMS } from '../items/ItemSystem';
import { tweenManager, Easing } from '../utils/Tween';
import { VOCABULARY, type VocabWord } from '../data/Vocabulary';

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

    public async enter(data?: any) {
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
                this.applyPlayerStats();

                this.setupUI();
                this.setupMonster();
                this.startTurn();
            } else {
                // Fresh Start
                this.mode = data?.mode || 'Beginner';
                this.game.playerState.inventory = [];
                this.game.playerState.score = 0;
                this.game.playerState.highestCombo = 0;
                this.applyPlayerStats();
                this.heroHp = this.heroMaxHp;
                this.level = 1;

                this.setupUI();
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
            this.setupMonster();
            this.startTurn();
        }

        // Auto-save at the start of every Combat Level
        this.game.playerState.saveToStorage(this.level, this.mode, this.heroHp, 0);

        window.addEventListener('keydown', this.handleKeyDown);
    }

    private applyPlayerStats() {
        const p = this.game.playerState;
        this.heroAtk = Math.max(1, Math.floor(2 * p.attackMultiplier));
        this.heroDef = Math.max(0, Math.floor(3 * p.defenseMultiplier));

        // Scale current HP based on ratio? Or just flat increase.
        // Easiest is to keep flat HP, just raise max. But if we want, we can buff it. Let's just raise max.
        const prevMax = this.heroMaxHp;
        this.heroMaxHp = Math.floor(120 * p.hpMultiplier);
        // If Max HP increased, give them the diff
        if (this.heroMaxHp > prevMax) {
            this.heroHp += (this.heroMaxHp - prevMax);
        }

        this.heroHeal = Math.floor(2 * p.healMultiplier);
    }

    private setupUI() {
        this.container.removeChildren(); // clear any previous UI if restarted

        // Draw entities
        this.heroSprite = this.drawHero();
        this.heroSprite.x = 150;
        this.heroSprite.y = 400;

        this.monsterSprite = this.drawMonster();
        this.monsterSprite.x = 550;
        this.monsterSprite.y = 370;

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
        this.heroHpText.y = 580;

        this.monsterHpText = new Text({ text: `Monster HP: -/-`, style: textStyle });
        this.monsterHpText.anchor.set(1, 1);
        this.monsterHpText.x = 780;
        this.monsterHpText.y = 580;

        this.wordContainer = new Container();
        this.wordContainer.x = 400;
        this.wordContainer.y = 250;

        this.timerGraphics = new Graphics();
        this.timerGraphics.x = 200;
        this.timerGraphics.y = 300;

        this.feedbackText = new Text({ text: '', style: new TextStyle({ fontFamily: 'Courier New', fontSize: 36, fill: '#ffff00', align: 'center', dropShadow: { alpha: 0.8, color: '#000000', distance: 2, blur: 2 } }) });
        this.feedbackText.anchor.set(0.5);
        this.feedbackText.x = 400;
        this.feedbackText.y = 150;

        // Combo UI
        this.comboContainer = new Container();
        this.comboContainer.x = 400;
        this.comboContainer.y = 100;
        this.comboScoreText = new Text({ text: '', style: new TextStyle({ fontFamily: 'Courier New', fontSize: 48, fontWeight: 'bold', fill: '#00ffff', align: 'center', dropShadow: { alpha: 0.8, color: '#000000', distance: 3, blur: 3 } }) });
        this.comboScoreText.anchor.set(0.5);
        this.comboContainer.addChild(this.comboScoreText);

        // Flash Overlay
        this.flashOverlay = new Graphics();
        this.flashOverlay.rect(0, 0, 800, 600).fill({ color: 0xffffff });
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

        if (keys.length === 0) return;

        const titleText = new Text({
            text: '獲得戰利品:',
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

    private setupMonster() {
        let multiplier = 1;
        if (this.level <= 10) multiplier = Math.pow(1.12, this.level - 1);
        else if (this.level <= 25) multiplier = Math.pow(1.12, 9) * Math.pow(1.10, this.level - 10);
        else if (this.level <= 50) multiplier = Math.pow(1.12, 9) * Math.pow(1.10, 15) * Math.pow(1.08, this.level - 25);
        else multiplier = Math.pow(1.12, 9) * Math.pow(1.10, 15) * Math.pow(1.08, 25) * Math.pow(1.05, this.level - 50);

        this.monsterMaxHp = Math.floor(100 * multiplier);
        this.monsterHp = this.monsterMaxHp;
        this.monsterAtk = Math.max(5, Math.floor(5 * multiplier));
        this.monsterDef = Math.max(1, Math.floor(1 * multiplier));
    }

    private startTurn() {
        this.state = 'TYPING';

        // Mode Specific Targets & Time
        const alphabet = "ABCDEFGHIJ";
        const allLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        this.targetQueue = [];
        this.targetQueueIndex = 0;

        if (this.mode === 'Beginner') {
            let newWord = "";
            for (let i = 0; i < 10; i++) {
                newWord += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
            }
            this.targetQueue.push({ text: newWord });
            this.timeLimit = Math.max(6, 8 - (Math.min(5, this.level - 1) * 0.4));
        } else if (this.mode === 'Intermediate') {
            let newWord = "";
            for (let i = 0; i < 10; i++) {
                newWord += allLetters.charAt(Math.floor(Math.random() * allLetters.length));
            }
            this.targetQueue.push({ text: newWord });
            this.timeLimit = Math.max(5, 6 - (Math.min(3, this.level - 1) * 0.33));
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
                this.showDamageNumber(this.heroSprite.x, this.heroSprite.y - 20, -healVal); // show as heal (negative damage is standard, but let's change text color later or just show a text)
            }
        }

        this.timeLimit += p.timeAddition;
        this.timeLeft = this.timeLimit;

        this.updateUI();
        this.renderWord();
        this.feedbackText.text = p.autoHealRate > 0 ? `Auto-Healed HP!` : '';
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

        if (this.mode !== 'Advanced') {
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
        if (this.state === 'GAME_OVER') {
            if (e.key === 'Enter') {
                this.enter(); // restart
            }
            return;
        }

        if (this.state !== 'TYPING') return;

        // Ensure audio context is started on user interaction
        if (e.key) {
            AudioUtils['init']?.(); // Ensure audio context is ready on first keypress
        }

        // Ignore modifiers
        if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) return;

        const expectedchar = this.targetWord[this.typedIndex];
        if (e.key.toUpperCase() === expectedchar.toUpperCase()) {
            // Correct
            this.letterTexts[this.typedIndex].style.fill = '#00ff00';
            const pitch = 1.0 + (this.currentCombo * 0.05);
            AudioUtils.playDing(Math.min(pitch, 2.0));
            this.spawnParticles(this.letterTexts[this.typedIndex].x + this.wordContainer.x, this.letterTexts[this.typedIndex].y + this.wordContainer.y, 0x00ff00, 5);
            this.typedIndex++;
            this.currentCombo++;
            this.game.playerState.highestCombo = Math.max(this.game.playerState.highestCombo, this.currentCombo);

            // Add score points for each correct letter
            this.game.playerState.score += 10;

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
                if (this.mode === 'Advanced') this.resolveAdvancedTarget();
                else this.resolveCombat();
            }
        } else {
            // Incorrect
            this.errors++;
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

    private executeMonsterCounter() {
        const p = this.game.playerState;

        if (this.monsterHp <= 0) {
            this.executeVictory();
            return;
        }

        // Monster wind up
        tweenManager.to({
            target: this.monsterSprite,
            props: { x: this.monsterSprite.x + 20 },
            duration: 200,
            easing: Easing.easeOutQuad,
            onComplete: () => {
                // Monster lunge
                tweenManager.to({
                    target: this.monsterSprite,
                    props: { x: this.monsterSprite.x - 60 },
                    duration: 100,
                    easing: Easing.easeInQuad,
                    onComplete: () => {
                        let armor = this.heroDef * (1.0 + this.levelBuffs.defBonus);
                        let monsterActualDmg = Math.max(1, Math.floor(this.monsterAtk - armor));
                        if (p.hasCritShield && this.heroHp <= this.heroMaxHp * 0.2) {
                            monsterActualDmg = 0;
                            this.showDamageNumber(this.heroSprite.x, this.heroSprite.y - 30, "SHIELD", '#00aaff');
                            p.hasCritShield = false;
                        }
                        this.heroHp -= monsterActualDmg;

                        AudioUtils.playExplosion();
                        this.spawnParticles(this.heroSprite.x + 25, this.heroSprite.y + 25, 0xff0000, 20);
                        this.showDamageNumber(this.heroSprite.x + 25, this.heroSprite.y - 20, monsterActualDmg);

                        // Screen Shake
                        const shakeAmp = 10;
                        tweenManager.to({
                            target: this.container, props: { x: -shakeAmp }, duration: 50, onComplete: () => {
                                tweenManager.to({
                                    target: this.container, props: { x: shakeAmp }, duration: 50, onComplete: () => {
                                        tweenManager.to({ target: this.container, props: { x: 0 }, duration: 50 });
                                    }
                                });
                            }
                        });

                        if (p.reflectDamageRatio > 0 && monsterActualDmg > 0) {
                            const reflect = Math.floor(monsterActualDmg * p.reflectDamageRatio);
                            if (reflect > 0) {
                                this.monsterHp -= reflect;
                                this.showDamageNumber(this.monsterSprite.x + 40, this.monsterSprite.y, reflect);
                            }
                        }
                        this.updateUI();

                        // Monster return
                        tweenManager.to({
                            target: this.monsterSprite,
                            props: { x: this.monsterSprite.x + 40 },
                            duration: 300,
                            easing: Easing.easeOutQuad,
                            onComplete: () => {
                                if (this.heroHp <= 0) {
                                    if (p.reviveCount > 0) {
                                        p.reviveCount--;
                                        this.heroHp = Math.floor(this.heroMaxHp * p.reviveHpRatio);
                                        this.feedbackText.text = `REVIVED!`;
                                        this.feedbackText.style.fill = '#00ff00';
                                        this.updateUI();
                                        setTimeout(() => { this.startTurn(); }, 1500);
                                    } else {
                                        this.heroHp = 0;
                                        this.updateUI();
                                        this.state = 'GAME_OVER';
                                        this.feedbackText.text = "GAME OVER\nPress ENTER to Restart";
                                        this.feedbackText.style.fill = '#ff0000';

                                        // Clear save on death
                                        import('../PlayerState').then(m => m.PlayerState.clearStorage());

                                        CloudSave.reportMatchResult({
                                            mode: this.mode,
                                            level: this.level,
                                            score: p.score,
                                            maxCombo: p.highestCombo,
                                            won: false
                                        });
                                    }
                                } else {
                                    setTimeout(() => { if (this.monsterHp > 0) this.startTurn(); else this.executeVictory(); }, 500);
                                }
                            }
                        });
                    }
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
                                // Perfect flash effect
                                this.flashOverlay.alpha = 0.5;
                                tweenManager.to({ target: this.flashOverlay, props: { alpha: 0 }, duration: 400 });
                            }

                            // Slash projectile
                            const slash = new Graphics();
                            slash.moveTo(0, -20).lineTo(20, 0).lineTo(0, 20).stroke({ color: 0x00ffff, width: 4 });
                            slash.x = this.heroSprite.x + 30;
                            slash.y = this.heroSprite.y + 20;
                            this.container.addChild(slash);

                            tweenManager.to({
                                target: slash,
                                props: { x: this.monsterSprite.x },
                                duration: 150,
                                onComplete: () => {
                                    this.container.removeChild(slash);
                                    slash.destroy();

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
                                }
                            });
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

        let rawDamage = Math.floor(baseOutput * this.heroAtk * comboMult * atkMult);
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
                        // Slash projectile
                        const slash = new Graphics();
                        slash.moveTo(0, -20).lineTo(20, 0).lineTo(0, 20).stroke({ color: 0x00ffff, width: 4 });
                        slash.x = this.heroSprite.x + 30;
                        slash.y = this.heroSprite.y + 20;
                        this.container.addChild(slash);

                        tweenManager.to({
                            target: slash,
                            props: { x: this.monsterSprite.x },
                            duration: 100,
                            onComplete: () => {
                                this.container.removeChild(slash);
                                slash.destroy();

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
                            }
                        });
                    }
                });
            }
        });
    }

    private resolveAdvancedTurnEnd() {
        this.state = 'RESOLVING';

        if (this.monsterHp <= 0) return;

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

    private executeVictory() {
        this.monsterHp = 0;
        this.heroHp = Math.min(this.heroMaxHp, this.heroHp + this.heroHeal); // Full clear        
        // Save progress right after victory (LocalStorage Cache)
        this.game.playerState.saveToStorage(this.level, this.mode, this.heroHp, 0);

        // Sync to Cloud
        CloudSave.saveProgress({
            level: this.level,
            mode: this.mode,
            currentHp: this.heroHp,
            hpBase: this.game.playerState.hpBase,
            score: this.game.playerState.score,
            highestCombo: this.game.playerState.highestCombo,
            inventory: this.game.playerState.inventory
        });

        CloudSave.reportMatchResult({
            mode: this.mode,
            level: this.level,
            score: this.game.playerState.score,
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
        const deltaMs = delta * (1000 / 60);
        tweenManager.update(deltaMs);

        if (this.state === 'TYPING') {
            this.timeLeft -= (delta / 60);

            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                if (this.mode === 'Advanced') this.resolveAdvancedTurnEnd();
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
        this.container.removeChildren();
        window.removeEventListener('keydown', this.handleKeyDown);
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
    private drawHero(): Graphics {
        const g = new Graphics();
        const pSize = 6; // pixel multiplier

        // 0=trans, 1=skin, 2=armor(gray), 3=dark iron, 4=sword(blue), 5=eye(black)
        const colors = [0x000000, 0xffccaa, 0xcccccc, 0x666666, 0x00ffff, 0x000000];
        const art = [
            [0, 0, 2, 2, 2, 0, 0, 0],
            [0, 2, 1, 5, 2, 0, 4, 0],
            [0, 2, 2, 2, 2, 4, 4, 0],
            [0, 0, 2, 3, 2, 4, 0, 0],
            [0, 3, 2, 2, 2, 3, 4, 0],
            [0, 3, 3, 3, 3, 3, 4, 4],
            [0, 0, 3, 0, 3, 0, 0, 0],
            [0, 0, 2, 0, 2, 0, 0, 0],
        ];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const px = art[r][c];
                if (px !== 0) {
                    g.rect(c * pSize, r * pSize, pSize, pSize).fill({ color: colors[px] });
                }
            }
        }
        return g;
    }

    private drawMonster(): Graphics {
        const g = new Graphics();

        // Slime type monster, scales a bit via size or just draw generic slime
        const pSize = 10;
        // 0=trans, 1=dark red/green, 2=light body, 3=white eye, 4=pupil
        const bodyColor = this.level > 10 ? 0xff4444 : 0x44ff44; // turn red after level 10
        const darkBody = this.level > 10 ? 0xaa0000 : 0x00aa00;
        const colors = [0x000000, darkBody, bodyColor, 0xffffff, 0x000000];
        const art = [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 2, 2, 0, 0, 0],
            [0, 0, 2, 2, 2, 2, 0, 0],
            [0, 2, 3, 4, 2, 3, 4, 0],
            [0, 2, 2, 2, 2, 2, 2, 0],
            [1, 2, 2, 2, 2, 2, 2, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0, 0, 0, 0],
        ];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const px = art[r][c];
                if (px !== 0) {
                    g.rect(c * pSize, r * pSize, pSize, pSize).fill({ color: colors[px] });
                }
            }
        }
        return g;
    }
}
