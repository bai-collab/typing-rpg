import { Text, TextStyle } from 'pixi.js';
import { Scene } from './Scene';

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
            this.menuOptions = [`Resume (Lv.${this.savedLevel})`, 'Beginner', 'Intermediate', 'Advanced'];
        } else {
            this.hasSaveData = false;
            this.menuOptions = ['Beginner', 'Intermediate', 'Advanced'];
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
        this.titleText.x = 400;
        this.titleText.y = 150;
        this.container.addChild(this.titleText);

        const optionStyle = new TextStyle({
            fontFamily: 'Courier New',
            fontSize: 28,
            fill: '#aaaaaa',
        });

        this.menuOptions.forEach((option, index) => {
            const t = new Text({ text: option, style: optionStyle });
            t.anchor.set(0.5);
            t.x = 400;
            t.y = 300 + index * 50;
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
        this.descriptionText.x = 400;
        this.descriptionText.y = 520;
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
            if (modeIdx === 0) this.descriptionText.text = "只有字母，適合新手暖身";
            else if (modeIdx === 1) this.descriptionText.text = "練習單字 (預設 25秒)";
            else if (modeIdx === 2) this.descriptionText.text = "練習單字 (地獄 10秒)";
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
            if (this.hasSaveData && this.selectedIndex === 0) {
                // Resume
                this.game.scenes.switchTo('combat', { fromResume: true });
            } else {
                // New Game (Clear old save)
                const modeIdx = this.hasSaveData ? this.selectedIndex - 1 : this.selectedIndex;
                const selectedMode = ['Beginner', 'Intermediate', 'Advanced'][modeIdx];

                import('../PlayerState').then(m => m.PlayerState.clearStorage());
                this.game.scenes.switchTo('combat', { mode: selectedMode });
            }
        }
    }

    public update(_delta: number) {
        if (this.optionsText[this.selectedIndex]) {
            this.optionsText[this.selectedIndex].alpha = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        }
    }

    public exit() {
        this.container.removeChildren();
        this.optionsText = [];
        window.removeEventListener('keydown', this.handleKeyDown);
    }
}
