import { Text, TextStyle } from 'pixi.js';
import { Scene } from './Scene';
import { AchievementSystem, ACHIEVEMENT_DEFINITIONS } from '../utils/AchievementSystem';
import { LeaderboardSystem } from '../utils/LeaderboardSystem';

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
            this.menuOptions = [`Resume (Lv.${this.savedLevel})`, 'Beginner', 'Intermediate', 'Advanced', 'Achievements', 'Leaderboard'];
        } else {
            this.hasSaveData = false;
            this.menuOptions = ['Beginner', 'Intermediate', 'Advanced', 'Achievements', 'Leaderboard'];
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
            t.y = 260 + index * 45;
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
        this.descriptionText.y = 540;
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
            else if (modeIdx === 2) this.descriptionText.text = "練習單字 (地獄 5秒)";
            else if (modeIdx === 3) this.descriptionText.text = "查看解鎖的成就";
            else if (modeIdx === 4) this.descriptionText.text = "查看本地前十名的高分紀錄";
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
            if (document.getElementById('typing-rpg-modal')) return;

            if (this.hasSaveData && this.selectedIndex === 0) {
                // Resume
                this.game.scenes.switchTo('combat', { fromResume: true });
            } else {
                const modeIdx = this.hasSaveData ? this.selectedIndex - 1 : this.selectedIndex;

                if (modeIdx === 3) {
                    this.showAchievementsModal();
                } else if (modeIdx === 4) {
                    this.showLeaderboardModal();
                } else {
                    // New Game
                    const selectedMode = ['Beginner', 'Intermediate', 'Advanced'][modeIdx];
                    import('../PlayerState').then(m => m.PlayerState.clearStorage());
                    this.game.scenes.switchTo('combat', { mode: selectedMode });
                }
            }
        }
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

    private showLeaderboardModal() {
        if (document.getElementById('typing-rpg-modal')) return;

        const runs = LeaderboardSystem.getTopRuns();

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
            border: '2px solid #00ff00'
        });

        let html = `<h2 style="color:#00ff00; text-align:center; margin-top:0;">本地排行榜 (Top 10)</h2>`;

        if (runs.length === 0) {
            html += `<p style="text-align:center; color:#aaa;">尚未有紀錄</p>`;
        } else {
            html += `<table style="width:100%; border-collapse:collapse; text-align:left;">
                <tr style="border-bottom:1px solid #555;">
                    <th style="padding:5px;">模式</th>
                    <th>關卡</th>
                    <th>正確率</th>
                    <th>日期</th>
                </tr>`;
            for (const r of runs) {
                const acc = (r.accuracy * 100).toFixed(1) + "%";
                html += `
                <tr style="border-bottom:1px solid #444;">
                    <td style="padding:5px; color:#aaa;">${r.mode}</td>
                    <td style="color:#fff; font-weight:bold;">Lv.${r.level}</td>
                    <td style="color:${r.accuracy >= 1 ? '#0f0' : '#fff'};">${acc}</td>
                    <td style="color:#888; font-size:12px;">${r.date}</td>
                </tr>`;
            }
            html += `</table>`;
        }

        html += `
        <div style="text-align:center; margin-top:20px; display:flex; justify-content:space-between;">
            <button id="clear-ldr-btn" style="padding:10px 15px; font-size:14px; cursor:pointer; background:#800; color:#fff; border:none; border-radius:5px;">刪除紀錄</button>
            <button id="close-modal-btn" style="padding:10px 20px; font-size:16px; cursor:pointer; background:#555; color:#fff; border:none; border-radius:5px;">關閉</button>
        </div>`;

        modalBox.innerHTML = html;
        modalOverlay.appendChild(modalBox);
        document.body.appendChild(modalOverlay);

        document.getElementById('close-modal-btn')!.onclick = () => modalOverlay.remove();
        document.getElementById('clear-ldr-btn')!.onclick = () => {
            if (confirm("確定要刪除所有本地紀錄嗎？")) {
                LeaderboardSystem.clearRuns();
                modalOverlay.remove();
                this.showLeaderboardModal(); // refresh
            }
        };
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
