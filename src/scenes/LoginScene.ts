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
        document.body.appendChild(this.formWrapper);
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
