import { Text, TextStyle } from 'pixi.js';
import { Scene } from './Scene';
import html2canvas from 'html2canvas';

export class GameOverScene extends Scene {
    private summaryText!: Text;
    private mode: string = '';
    private level: number = 1;
    private accuracy: number = 0;
    private score: number = 0;

    private htmlOverlay!: HTMLDivElement;

    public enter(data?: any) {
        this.mode = data?.mode || 'Unknown';
        this.level = data?.level || 1;
        this.accuracy = data?.accuracy || 0;
        this.score = this.game.playerState.score || 0;

        const style = new TextStyle({
            fontFamily: 'Courier New',
            fontSize: 48,
            fill: '#ff0000',
            fontWeight: 'bold',
            dropShadow: { alpha: 0.8, color: '#000000', distance: 4, blur: 4 }
        });

        const title = new Text({ text: 'GAME OVER', style });
        title.anchor.set(0.5);
        title.x = this.game.app.screen.width / 2;
        title.y = this.game.app.screen.height * 0.25;
        this.container.addChild(title);

        const summaryStyle = new TextStyle({
            fontFamily: '"Microsoft JhengHei", Arial',
            fontSize: 24,
            fill: '#ffffff',
            align: 'center',
            lineHeight: 40
        });

        const accStr = (this.accuracy * 100).toFixed(1) + "%";
        this.summaryText = new Text({
            text: `難度: ${this.mode}\n生存關卡: Lv.${this.level}\n正確率: ${accStr}\n總分: ${this.score}`,
            style: summaryStyle
        });
        this.summaryText.anchor.set(0.5);
        this.summaryText.x = this.game.app.screen.width / 2;
        this.summaryText.y = this.game.app.screen.height * 0.58; // 350/600
        this.container.addChild(this.summaryText);

        this.createHtmlOverlay();
    }

    private createHtmlOverlay() {
        if (document.getElementById('game-over-overlay')) return;

        this.htmlOverlay = document.createElement('div');
        this.htmlOverlay.id = 'game-over-overlay';
        Object.assign(this.htmlOverlay.style, {
            position: 'absolute', top: '80%', left: '0', width: '100%',
            display: 'flex', justifyContent: 'center', gap: '20px', zIndex: '10'
        });

        const shareBtn = document.createElement('button');
        shareBtn.textContent = '分享成績 📸';
        Object.assign(shareBtn.style, {
            padding: '10px 20px', fontSize: '18px', cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px'
        });
        shareBtn.onclick = () => this.handleShare();

        const menuBtn = document.createElement('button');
        menuBtn.textContent = '回主選單 🏠';
        Object.assign(menuBtn.style, {
            padding: '10px 20px', fontSize: '18px', cursor: 'pointer', background: '#555', color: 'white', border: 'none', borderRadius: '8px'
        });
        menuBtn.onclick = () => {
            this.game.scenes.switchTo('menu');
        };

        this.htmlOverlay.appendChild(shareBtn);
        this.htmlOverlay.appendChild(menuBtn);
        document.body.appendChild(this.htmlOverlay);
    }

    private async handleShare() {
        const classId = localStorage.getItem('typingRpgClassId') || '無名戰士';

        // Create an offscreen div for html2canvas to render
        const shareDiv = document.createElement('div');
        Object.assign(shareDiv.style, {
            position: 'absolute', top: '-9999px', left: '-9999px', width: '600px', height: '450px',
            background: 'linear-gradient(135deg, #1a1a24 0%, #2a2a40 100%)',
            color: 'white', fontFamily: '"Microsoft JhengHei", Arial, sans-serif',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            border: '4px solid #ffd700', borderRadius: '15px'
        });

        const accStr = (this.accuracy * 100).toFixed(1) + "%";
        const copyText = `我在打字 RPG 中 (${this.mode} 模式) 通關了第 ${this.level} 關！學員代號: ${classId}，你能超越我嗎？`;

        shareDiv.innerHTML = `
            <h1 style="color:#ffd700; font-size:40px; margin:10px 0;">Typing RPG</h1>
            <h2 style="color:#00ffff; font-size:28px; margin:5px 0;">挑戰紀錄</h2>
            <div style="font-size:18px; color:#ffd700; margin-bottom:10px;">正式學員: ${classId}</div>
            <div style="background:rgba(0,0,0,0.5); padding:20px; border-radius:10px; margin-top:10px; text-align:center; min-width:250px;">
                <p style="font-size:22px; margin:5px 0;">難度: <span style="color:#ffaa00;">${this.mode}</span></p>
                <p style="font-size:32px; margin:10px 0;">生存至 <span style="color:#00ff00; font-weight:bold;">Lv.${this.level}</span></p>
                <p style="font-size:22px; margin:5px 0;">正確率: <span style="color:#ff00ff;">${accStr}</span></p>
            </div>
            <p style="margin-top:20px; font-size:16px; color:#aaa;">Can you beat my score?</p>
        `;

        document.body.appendChild(shareDiv);

        try {
            const canvas = await html2canvas(shareDiv, { backgroundColor: null });
            const dataUrl = canvas.toDataURL('image/png');

            // Trigger download
            const link = document.createElement('a');
            link.download = `typing-rpg-score-lv${this.level}.png`;
            link.href = dataUrl;
            link.click();

            // Copy text
            await navigator.clipboard.writeText(copyText);
            alert("成績圖片已下載，且分享文字已複製到剪貼簿！\\n\\n" + copyText);

        } catch (e) {
            console.error("Html2Canvas Error:", e);
            alert("圖片生成失敗！但文字已複製到剪貼簿。");
            navigator.clipboard.writeText(copyText);
        } finally {
            shareDiv.remove();
        }
    }

    public exit() {
        this.container.removeChildren();
        if (this.htmlOverlay) {
            this.htmlOverlay.remove();
        }
    }

    public onResize(width: number, height: number): void {
        if (this.summaryText) {
            this.summaryText.x = width / 2;
            this.summaryText.y = height * 0.58;
        }
        const title = this.container.children.find(c => c instanceof Text && c.text === 'GAME OVER') as Text;
        if (title) {
            title.x = width / 2;
            title.y = height * 0.25;
        }
        if (this.htmlOverlay) {
            this.htmlOverlay.style.top = (height * 0.8) + 'px';
        }
    }

    public update(_delta: number) { }
}
