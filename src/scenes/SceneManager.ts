import { Container, Ticker } from 'pixi.js';
import { Game } from '../Game';
import { Scene } from './Scene';

export class SceneManager {
    private game: Game;
    private scenes: Map<string, Scene> = new Map();
    private currentScene: Scene | null = null;
    public container: Container;

    constructor(game: Game) {
        this.game = game;
        this.container = new Container();
        this.game.app.stage.addChild(this.container);

        // Setup ticker for updates
        this.game.app.ticker.add((ticker: Ticker) => {
            if (this.currentScene) {
                this.currentScene.update(ticker.deltaTime);
            }
        });
    }

    public register(name: string, scene: Scene) {
        this.scenes.set(name, scene);
    }

    public async switchTo(name: string, data?: any) {
        if (this.currentScene) {
            this.container.removeChild(this.currentScene.container);
            this.currentScene.exit();
        }

        const scene = this.scenes.get(name);
        if (scene) {
            this.currentScene = scene;
            this.container.addChild(this.currentScene.container);
            await this.currentScene.enter(data);
        } else {
            console.error(`Scene ${name} not found!`);
        }
    }
}
