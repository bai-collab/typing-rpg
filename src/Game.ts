import { Application } from 'pixi.js';
import { SceneManager } from './scenes/SceneManager';
import { MainMenuScene } from './scenes/MainMenuScene';
import { CombatScene } from './scenes/CombatScene';
import { ItemRewardScene } from './scenes/ItemRewardScene';
import { LoginScene } from './scenes/LoginScene';
import { GameOverScene } from './scenes/GameOverScene';
import { PlayerState } from './PlayerState';

export class Game {
    public app: Application;
    public scenes!: SceneManager;
    public playerState: PlayerState;

    constructor() {
        this.app = new Application();
        this.playerState = new PlayerState();
    }

    public async init(container: HTMLElement) {
        await this.app.init({
            resizeTo: window,
            backgroundColor: 0x1a1a24,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });

        // Add canvas to the DOM
        container.appendChild(this.app.canvas);

        this.scenes = new SceneManager(this);

        // Register Scenes
        this.scenes.register('login', new LoginScene(this) as any);
        this.scenes.register('menu', new MainMenuScene(this));
        this.scenes.register('combat', new CombatScene(this));
        this.scenes.register('reward', new ItemRewardScene(this));
        this.scenes.register('gameover', new GameOverScene(this));

        // Start
        this.scenes.switchTo('login');
    }
}
