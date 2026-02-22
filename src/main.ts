import './style.css';
import { Game } from './Game';

const appElement = document.getElementById('app')!;
appElement.innerHTML = ''; // Clear default Vite content
const game = new Game();
game.init(appElement);
