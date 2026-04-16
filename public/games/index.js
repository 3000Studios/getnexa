// Catalog of games. Each entry declares id, name, description, emoji, and mount function.

import { mountSnake } from './snake.js';
import { mountTwenty48 } from './twenty48.js';
import { mountTetris } from './tetris.js';
import { mountMemory } from './memory.js';
import { mountPong } from './pong.js';
import { mountTicTacToe } from './tictactoe.js';
import { mountBreakout } from './breakout.js';
import { mountMinesweeper } from './minesweeper.js';

export const GAMES = [
  {
    id: 'snake',
    name: 'Nexa Snake',
    short: 'Classic snake — eat, grow, survive.',
    description: 'The classic snake game — eat the glowing orbs to grow, but don\'t hit the walls or yourself. How long can you survive?',
    emoji: '🐍',
    multiplayer: false,
    new: true,
    mount: mountSnake,
  },
  {
    id: '2048',
    name: '2048',
    short: 'Merge tiles to reach 2048.',
    description: 'Combine tiles with matching numbers to reach 2048. Simple rules, addictive play.',
    emoji: '🔢',
    multiplayer: false,
    mount: mountTwenty48,
  },
  {
    id: 'tetris',
    name: 'Nexa Tetris',
    short: 'Stack falling blocks to clear rows.',
    description: 'The timeless falling-block puzzle. Clear lines, chase combos, and survive increasing speed.',
    emoji: '🟦',
    multiplayer: false,
    mount: mountTetris,
  },
  {
    id: 'memory',
    name: 'Memory Match',
    short: 'Flip cards to find pairs.',
    description: 'Train your memory. Flip two cards at a time and match them all — with the fewest moves.',
    emoji: '🧠',
    multiplayer: false,
    mount: mountMemory,
  },
  {
    id: 'breakout',
    name: 'Brick Breaker',
    short: 'Bounce the ball. Smash the bricks.',
    description: 'Move the paddle and break all the bricks. Don\'t let the ball fall.',
    emoji: '🧱',
    multiplayer: false,
    mount: mountBreakout,
  },
  {
    id: 'minesweeper',
    name: 'Minesweeper',
    short: 'Find safe squares. Avoid the mines.',
    description: 'The classic logic puzzle. Reveal numbers to deduce where the mines are. Don\'t click a mine.',
    emoji: '💣',
    multiplayer: false,
    mount: mountMinesweeper,
  },
  {
    id: 'tictactoe',
    name: 'Tic-Tac-Toe',
    short: 'Real-time 2-player. Share a room code.',
    description: 'Play live tic-tac-toe against a friend. Share the room code and battle in real time.',
    emoji: '❌',
    multiplayer: true,
    new: true,
    mount: mountTicTacToe,
  },
  {
    id: 'pong',
    name: 'Nexa Pong',
    short: 'The original arcade classic.',
    description: 'Bounce the ball past your opponent. Practice vs AI in single-player.',
    emoji: '🏓',
    multiplayer: false,
    mount: mountPong,
  },
];

export function findGame(id) { return GAMES.find(g => g.id === id); }
