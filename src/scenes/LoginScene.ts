import { Text, TextStyle } from 'pixi.js';
import { Game } from '../Game';

import { Scene } from './Scene';
import { CloudSave } from '../utils/CloudSave';

export class LoginScene extends Scene {
    // HTML Wrapper for overlay input fields
    private formWrapper: HTMLDivElement | null = null;
    private titleText: Text;

    constructor(game: Game) {
        super(game);

        this.titleText = new Text({
            text: 'Typing RPG 登入系統',
            style: new TextStyle({ fontFamily: '"Microsoft JhengHei", Arial', fontSize: 48, fill: '#ffffff', dropShadow: { alpha: 0.5, color: '#000', distance: 2 } })
        });
        this.titleText.anchor.set(0.5);
        this.titleText.x = window.innerWidth / 2;
        this.titleText.y = window.innerHeight * 0.2;
        this.container.addChild(this.titleText);

        this.createHTMLForm();
    }

    private createHTMLForm() {
        if (this.formWrapper) return;

        this.formWrapper = document.createElement('div');
        this.formWrapper.style.position = 'absolute';
        this.formWrapper.style.top = '0';
        this.formWrapper.style.left = '0';
        this.formWrapper.style.width = '100vw';
        this.formWrapper.style.height = '100vh';
        this.formWrapper.style.display = 'flex';
        this.formWrapper.style.flexDirection = 'column';
        this.formWrapper.style.justifyContent = 'center';
        this.formWrapper.style.alignItems = 'center';
        this.formWrapper.style.pointerEvents = 'none'; // Let clicks pass through empty space

        const formBox = document.createElement('form');
        formBox.style.pointerEvents = 'auto'; // Catch clicks on the form
        formBox.style.backgroundColor = 'rgba(20, 20, 30, 0.9)';
        formBox.style.padding = '40px';
        formBox.style.borderRadius = '12px';
        formBox.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5)';
        formBox.style.display = 'flex';
        formBox.style.flexDirection = 'column';
        formBox.style.gap = '20px';
        formBox.style.minWidth = '300px';

        // Load existing data
        const savedClassId = localStorage.getItem('typingRpgClassId') || '';
        const savedPin = localStorage.getItem('typingRpgPin') || '';
        const savedGasUrl = localStorage.getItem('typingRpgGasUrl') || 'https://script.google.com/macros/s/AKfycbzvQIegWDDJ-ACkhrQhOqW2Glwnxu_zqnFrPsqE7rOXgV_mJxFks5b_m0UtuVx0eoqk/exec';

        // Class ID
        const classIdGroup = this.createFormGroup('班級座號 (例如：101-01)', 'text', 'classId', savedClassId);
        formBox.appendChild(classIdGroup.wrapper);

        // PIN
        const pinGroup = this.createFormGroup('四碼密碼設定 (PIN)', 'password', 'pin', savedPin);
        pinGroup.input.maxLength = 4;
        formBox.appendChild(pinGroup.wrapper);

        // GAS URL
        const gasUrlGroup = this.createFormGroup('GAS URL (選項)', 'url', 'gasUrl', savedGasUrl);
        gasUrlGroup.input.placeholder = "https://script.google.com/macros/s/...";
        formBox.appendChild(gasUrlGroup.wrapper);

        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.textContent = '進入遊戲';
        submitBtn.style.padding = '12px 24px';
        submitBtn.style.fontSize = '18px';
        submitBtn.style.fontWeight = 'bold';
        submitBtn.style.backgroundColor = '#4CAF50';
        submitBtn.style.color = 'white';
        submitBtn.style.border = 'none';
        submitBtn.style.borderRadius = '8px';
        submitBtn.style.cursor = 'pointer';
        submitBtn.style.marginTop = '10px';
        submitBtn.onmouseover = () => submitBtn.style.backgroundColor = '#45a049';
        submitBtn.onmouseleave = () => submitBtn.style.backgroundColor = '#4CAF50';

        formBox.appendChild(submitBtn);

        formBox.onsubmit = (e) => {
            e.preventDefault();

            const classId = classIdGroup.input.value.trim();
            const pin = pinGroup.input.value.trim();
            const gasUrl = gasUrlGroup.input.value.trim();

            if (!classId || !pin) {
                alert("請填寫班級座號與密碼！");
                return;
            }

            localStorage.setItem('typingRpgClassId', classId);
            localStorage.setItem('typingRpgPin', pin);
            localStorage.setItem('typingRpgGasUrl', gasUrl);

            // Cloud Load: Fetch progress from Google Sheets
            submitBtn.disabled = true;
            submitBtn.textContent = '載入存檔中...';

            CloudSave.loadProgress().then(cloudData => {
                if (cloudData) {
                    console.log("LoginScene: Cloud save found, syncing to local.");
                    localStorage.setItem('typingRpgSaveData', JSON.stringify(cloudData));
                } else {
                    console.log("LoginScene: No cloud save found.");
                }

                this.cleanup();
                this.game.scenes.switchTo('menu');
            }).catch(err => {
                console.error("LoginScene: Cloud load failed", err);
                this.cleanup();
                this.game.scenes.switchTo('menu');
            });
        };

        this.formWrapper.appendChild(formBox);

        // Add Help Icon
        const helpBtn = document.createElement('button');
        helpBtn.innerText = '?';
        helpBtn.style.position = 'absolute';
        helpBtn.style.top = '20px';
        helpBtn.style.right = '20px';
        helpBtn.style.width = '40px';
        helpBtn.style.height = '40px';
        helpBtn.style.borderRadius = '20px';
        helpBtn.style.backgroundColor = '#4CAF50';
        helpBtn.style.color = 'white';
        helpBtn.style.fontSize = '24px';
        helpBtn.style.fontWeight = 'bold';
        helpBtn.style.border = 'none';
        helpBtn.style.cursor = 'pointer';
        helpBtn.style.pointerEvents = 'auto';
        helpBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)';
        helpBtn.onclick = () => this.showHelpModal();
        this.formWrapper.appendChild(helpBtn);

        document.body.appendChild(this.formWrapper);
    }

    private showHelpModal() {
        if (document.getElementById('typing-rpg-help-modal')) return;

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'typing-rpg-help-modal';
        modalOverlay.style.position = 'fixed';
        modalOverlay.style.top = '0';
        modalOverlay.style.left = '0';
        modalOverlay.style.width = '100vw';
        modalOverlay.style.height = '100vh';
        modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        modalOverlay.style.display = 'flex';
        modalOverlay.style.justifyContent = 'center';
        modalOverlay.style.alignItems = 'center';
        modalOverlay.style.zIndex = '1000';

        const modalBox = document.createElement('div');
        modalBox.style.backgroundColor = '#2a2a35';
        modalBox.style.padding = '30px';
        modalBox.style.borderRadius = '12px';
        modalBox.style.color = '#ffffff';
        modalBox.style.fontFamily = '"Microsoft JhengHei", Arial';
        modalBox.style.maxWidth = '600px';
        modalBox.style.maxHeight = '80vh';
        modalBox.style.overflowY = 'auto';
        modalBox.style.lineHeight = '1.6';

        modalBox.innerHTML = `
            <h2 style="margin-top:0; color:#4CAF50;">遊戲說明 (How to Play)</h2>
            <p>歡迎來到 Typing RPG！在這裡你需要透過打字來擊敗怪物。</p>
            <h3>難度差異</h3>
            <ul>
                <li><strong>Beginner：</strong>只有隨機字母，容錯率高，節奏慢。</li>
                <li><strong>Intermediate：</strong>練習單字，每回合給予 5 個單字，25秒倒數。</li>
                <li><strong>Advanced：</strong>挑戰極限，每回合 5 個單字，只有 5秒倒數！</li>
            </ul>
            <h3>戰鬥系統與 Combo</h3>
            <ul>
                <li>連續輸入正確字元會累積 Combo，Combo 越高攻擊越高！全對會觸發 Perfect (流星雨特效)。</li>
                <li>打錯字會重置 Combo，且影響結算準確率 (Accuracy)。</li>
            </ul>
            <h3>單字能力標籤 (中/高階)</h3>
            <p>單字可能會帶有特殊類別，打完該單字立即獲得 Buff：</p>
            <ul>
                <li>🛡️ (衣服/配件)：防禦力提升</li>
                <li>⚔️ (食物/飲料)：攻擊力提升</li>
                <li>⏰ (時間)：回合時間 +1 秒</li>
                <li>❤️ (學校)：恢復生命值</li>
                <li>🐾 (動物/昆蟲)：狂暴狀態 (傷害狂飆)</li>
                <li>🍃 (天氣/自然)：獲得 3 回合持續回血</li>
            </ul>
            <button id="close-help-btn" style="margin-top:20px; padding:10px 20px; background:#f44336; color:white; border:none; border-radius:6px; cursor:pointer; font-size:16px;">關閉說明</button>
        `;

        modalOverlay.appendChild(modalBox);
        document.body.appendChild(modalOverlay);

        document.getElementById('close-help-btn')!.onclick = () => {
            modalOverlay.remove();
        };
    }

    private createFormGroup(labelText: string, type: string, id: string, value: string) {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.gap = '8px';

        const label = document.createElement('label');
        label.textContent = labelText;
        label.htmlFor = id;
        label.style.color = '#ffffff';
        label.style.fontFamily = '"Microsoft JhengHei", Arial';
        label.style.fontSize = '16px';

        const input = document.createElement('input');
        input.type = type;
        input.id = id;
        input.value = value;
        input.style.padding = '10px';
        input.style.fontSize = '16px';
        input.style.borderRadius = '6px';
        input.style.border = '1px solid #555';
        input.style.backgroundColor = '#2a2a35';
        input.style.color = '#ffffff';

        wrapper.appendChild(label);
        wrapper.appendChild(input);

        return { wrapper, input };
    }

    public enter() {
        this.createHTMLForm();
    }

    public update(_dt: number) {
        // No per-frame updates needed for HTML overlay
    }

    public exit() {
        this.cleanup();
    }

    public cleanup() {
        if (this.formWrapper && this.formWrapper.parentNode) {
            this.formWrapper.parentNode.removeChild(this.formWrapper);
            this.formWrapper = null;
        }
    }

    public onResize() {
        this.titleText.x = window.innerWidth / 2;
        this.titleText.y = window.innerHeight * 0.2;
    }
}
