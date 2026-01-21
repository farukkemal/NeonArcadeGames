/**
 * NeonArcade Main JavaScript
 * Engine, Audio, Input, and Boot Logic
 */

// --- IMPORTS ---
import { SnakeGame } from './games/snake.js';
import { BrickBreakerGame } from './games/brick.js';
import { TicTacToeGame } from './games/tictactoe.js';
import { MemoryGame } from './games/memory.js';
import { ReflexGame } from './games/reflex.js';
import { WhackGame } from './games/whack.js';
import { FlappyGame } from './games/flappy.js';
import { Game2048 } from './games/game2048.js';
import { SimonGame } from './games/simon.js';
import { WordleGame } from './games/wordle.js';
import { SpaceInvadersGame } from './games/spaceinvaders.js';
import { TetrisGame } from './games/tetris.js';
import { HackerGame } from './games/hacker.js';
import { RunnerGame } from './games/runner.js';
import { SlicerGame } from './games/slicer.js';
import { LockGame } from './games/lock.js';
import { BattleshipGame } from './games/battleship.js';
import { MinesweeperGame } from './games/minesweeper.js';
import { StackGame } from './games/stack.js';
import { GravityGame } from './games/gravity.js';
import { GolfGame } from './games/golf.js';

// Touch Controller for mobile
import { initVirtualGamepad, showGamepad, preventScrollOnTouch, isMobile } from './touchController.js';

// --- UTILITIES ---
const Utils = {
    random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    randomFloat: (min, max) => Math.random() * (max - min) + min,
    lerp: (a, b, t) => a + (b - a) * t,
    aabb: (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
};

// --- AUDIO MANAGER ---
const Audio = {
    ctx: null,
    sounds: {
        eat: [440, 0.1, 'square'],
        hit: [220, 0.1, 'sawtooth'],
        gameover: [110, 0.3, 'sawtooth'],
        win: [880, 0.2, 'sine'],
        click: [660, 0.05, 'sine']
    },
    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },
    play(name) {
        this.init();
        const [freq, dur, type] = this.sounds[name] || this.sounds.click;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + dur);
    }
};

// --- INPUT MANAGER ---
const Input = {
    keys: {},
    mouse: { x: 0, y: 0, down: false },
    isDown(key) { return !!this.keys[key]; }
};

// --- DOM HELPER ---
const $ = id => document.getElementById(id);

// --- GAME ENGINE ---
const Engine = {
    currentGame: null,
    globalScore: parseInt(localStorage.getItem('neon_score')) || 0,

    start(gameType) {
        const modal = $('gameModal');
        const container = $('gameContainer');
        const scoreDisplay = $('currentGameScore');
        const title = $('modalTitle');

        if (!modal || !container || !scoreDisplay || !title) {
            console.error('Modal elements not found');
            return;
        }

        modal.classList.add('active');

        // Game Factory
        switch (gameType) {
            case 'snake':
                title.innerText = "SNAKE";
                this.currentGame = new SnakeGame(container, scoreDisplay, (s) => this.endGame(s));
                break;
            case 'brick':
                title.innerText = "NEON KIRICI";
                this.currentGame = new BrickBreakerGame(container, scoreDisplay, (s) => this.endGame(s));
                break;
            case 'tictactoe':
                title.innerText = "XOX";
                this.currentGame = new TicTacToeGame(container, scoreDisplay, (s) => this.endGame(s));
                break;
            case 'reflex':
                title.innerText = "REFLEKS TESTİ";
                this.currentGame = new ReflexGame(container, scoreDisplay, (s) => this.endGame(s));
                break;
            case 'memory':
                title.innerText = "HAFIZA KARTLARI";
                this.currentGame = new MemoryGame(container, scoreDisplay, (s) => this.endGame(s));
                break;
            case 'whack':
                title.innerText = "IŞIKLARI YAKALA";
                this.currentGame = new WhackGame(container, scoreDisplay, (s) => this.endGame(s));
                break;
            case 'flappy':
                title.innerText = "NEON FLAPPY";
                this.currentGame = new FlappyGame(container, scoreDisplay, (s) => this.endGame(s));
                break;
            case 'game2048':
                title.innerText = "NEON 2048";
                this.currentGame = new Game2048(container, scoreDisplay, (s) => this.endGame(s));
                break;
            case 'simon':
                title.innerText = "CYBER SIMON";
                this.currentGame = new SimonGame(container, scoreDisplay, (s) => this.endGame(s));
                break;
            case 'wordle':
                title.innerText = "KELİME KORSANI";
                this.currentGame = new WordleGame(container, scoreDisplay, (s) => this.endGame(s));
                break;
            case 'spaceinvaders':
                title.innerText = "CYBER DEFENDERS";
                this.currentGame = new SpaceInvadersGame(container, scoreDisplay, (s) => this.endGame(s));
                break;
            case 'tetris':
                title.innerText = "NEON BLOCKS";
                this.currentGame = new TetrisGame(container, scoreDisplay, (s) => this.endGame(s));
                break;
            case 'hacker':
                title.innerText = "MATRIX HACKER";
                this.currentGame = new HackerGame(container, scoreDisplay, (s) => this.endGame(s));
                break;
            case 'runner':
                title.innerText = "NEON RUNNER";
                this.currentGame = new RunnerGame(container, scoreDisplay, (s) => this.endGame(s));
                break;
            case 'slicer':
                title.innerText = "DATA SLICER";
                this.currentGame = new SlicerGame(container, scoreDisplay, (s) => this.endGame(s));
                break;
            case 'lock':
                title.innerText = "HACK THE LOCK";
                this.currentGame = new LockGame(container, scoreDisplay, (s) => this.endGame(s));
                break;
            case 'battleship':
                title.innerText = "QUANTUM FLEET";
                this.currentGame = new BattleshipGame(container, scoreDisplay, (s) => this.endGame(s));
                break;
            case 'minesweeper':
                title.innerText = "GLITCH SWEEPER";
                this.currentGame = new MinesweeperGame(container, scoreDisplay, (s) => this.endGame(s));
                break;
            case 'stack':
                title.innerText = "NEON STACK";
                this.currentGame = new StackGame(container, scoreDisplay, (s) => this.endGame(s));
                break;
            case 'gravity':
                title.innerText = "GRAVITY SHIFT";
                this.currentGame = new GravityGame(container, scoreDisplay, (s) => this.endGame(s));
                break;
            case 'golf':
                title.innerText = "CYBER GOLF";
                this.currentGame = new GolfGame(container, scoreDisplay, (s) => this.endGame(s));
                break;
            default:
                console.warn(`Unknown game type: ${gameType}`);
                return;
        }

        if (this.currentGame) this.currentGame.start();
    },

    endGame(score) {
        this.globalScore += score;
        localStorage.setItem('neon_score', this.globalScore);
        const globalScoreEl = $('globalScore');
        if (globalScoreEl) globalScoreEl.innerText = this.globalScore;
    },

    restart() {
        if (this.currentGame) {
            const Type = this.currentGame.constructor;
            const container = $('gameContainer');
            const scoreDisplay = $('currentGameScore');
            this.currentGame.stop();
            this.currentGame = new Type(container, scoreDisplay, (s) => this.endGame(s));
            this.currentGame.start();

            // Show virtual gamepad on mobile
            showGamepad(true);

            // Prevent scroll on game container
            if (isMobile()) {
                preventScrollOnTouch(container);
            }
        }
    },

    close() {
        if (this.currentGame) {
            this.currentGame.stop();
            this.currentGame = null;
        }
        const modal = $('gameModal');
        if (modal) modal.classList.remove('active');

        // Hide virtual gamepad
        showGamepad(false);
    }
};

// --- INITIALIZE ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Global Score
    const globalScoreEl = $('globalScore');
    if (globalScoreEl) globalScoreEl.innerText = Engine.globalScore;

    // Initialize virtual gamepad for mobile
    initVirtualGamepad();

    // Global Event Hooks
    window.startGame = (type) => Engine.start(type);
    window.closeModal = () => Engine.close();
    window.Engine = Engine;
    window.Audio = Audio;

    // Input Tracking
    window.addEventListener('keydown', e => {
        Input.keys[e.key] = true;
        // Prevent page scroll when game modal is open
        const modal = document.getElementById('gameModal');
        if (modal && modal.classList.contains('active') &&
            [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
    });
    window.addEventListener('keyup', e => Input.keys[e.key] = false);
    window.addEventListener('mousemove', e => {
        Input.mouse.x = e.clientX;
        Input.mouse.y = e.clientY;
    });
    window.addEventListener('mousedown', () => Input.mouse.down = true);
    window.addEventListener('mouseup', () => Input.mouse.down = false);

    // Theme Toggle
    const toggleBtn = $('themeToggle');
    const html = document.documentElement;
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            html.classList.toggle('dark');
            localStorage.theme = html.classList.contains('dark') ? 'dark' : 'light';
        });
    }

    // --- PRELOADER ---
    const preloader = $('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.style.opacity = '0';
            preloader.style.transition = 'opacity 0.5s ease';
            setTimeout(() => preloader.remove(), 500);
        }, 800);
    }

    // --- CATEGORY FILTER & SEARCH ---
    const gameCards = document.querySelectorAll('#gameGrid > div');
    const searchInput = $('gameSearch');
    const categoryBtns = document.querySelectorAll('.cat-btn');
    const gameCountEl = $('gameCount');
    let currentCategory = 'all';

    // Category mapping for each card
    const categoryMap = {
        'snake': 'reflex', 'memory': 'puzzle', 'reflex': 'reflex', 'tictactoe': 'puzzle',
        'brick': 'action', 'whack': 'reflex', 'flappy': 'action', 'game2048': 'puzzle',
        'simon': 'puzzle', 'wordle': 'puzzle', 'spaceinvaders': 'action', 'tetris': 'puzzle',
        'hacker': 'reflex', 'runner': 'action', 'slicer': 'action', 'lock': 'reflex',
        'battleship': 'strategy', 'minesweeper': 'strategy',
        'stack': 'reflex', 'gravity': 'action', 'golf': 'puzzle'
    };

    // Assign categories to cards based on their play button
    gameCards.forEach(card => {
        const btn = card.querySelector('button[onclick]');
        if (btn) {
            const match = btn.getAttribute('onclick')?.match(/startGame\('(\w+)'\)/);
            if (match && categoryMap[match[1]]) {
                card.dataset.category = categoryMap[match[1]];
            }
        }
        card.classList.add('game-card');
    });

    function filterGames() {
        const searchTerm = searchInput?.value.toLowerCase() || '';
        let visibleCount = 0;

        gameCards.forEach(card => {
            const title = card.querySelector('h4')?.textContent.toLowerCase() || '';
            const category = card.dataset.category || 'all';
            const matchesSearch = title.includes(searchTerm);
            const matchesCategory = currentCategory === 'all' || category === currentCategory;

            if (matchesSearch && matchesCategory) {
                card.style.display = '';
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
                visibleCount++;
            } else {
                card.style.opacity = '0';
                card.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    if (card.style.opacity === '0') card.style.display = 'none';
                }, 200);
            }
        });

        if (gameCountEl) gameCountEl.textContent = visibleCount;
    }

    // Search input handler
    if (searchInput) {
        searchInput.addEventListener('input', filterGames);
    }

    // Category button handlers
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => {
                b.classList.remove('active', 'bg-neon-blue', 'text-black');
                b.classList.add('bg-gray-200', 'dark:bg-gray-800');
            });
            btn.classList.add('active', 'bg-neon-blue', 'text-black');
            btn.classList.remove('bg-gray-200', 'dark:bg-gray-800');
            currentCategory = btn.dataset.cat;
            filterGames();
        });
    });

    console.log('🎮 NeonArcade Initialized with ' + gameCards.length + ' games');
});

// Export for potential external usage
export { Engine, Audio, Input, Utils };
