import { Container } from 'pixi.js';
import { Game } from '../Game';

export abstract class Scene {
    protected game: Game;
    public container: Container;

    constructor(game: Game) {
        this.game = game;
        this.container = new Container();
    }

    public abstract enter(data?: any): void | Promise<void>;
    public abstract update(delta: number): void;
    public abstract exit(): void;
    public onResize?(width: number, height: number): void;
}
