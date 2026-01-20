/**
 * Cyber Simon Game
 */
import { Game } from './Game.js';

export class SimonGame extends Game {
    init() {
        this.container.innerHTML = '';
        this.sequence = [];
        this.playerIndex = 0;
        this.level = 0;
        this.isPlaying = false;
        this.colors = ['red', 'blue', 'green', 'yellow'];
        this.colorMap = { red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308' };
        this.createUI();
        this.showStart();
    }

    createUI() {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex flex-col items-center gap-6';

        this.levelEl = document.createElement('div');
        this.levelEl.className = 'text-xl font-display text-indigo-400';
        this.levelEl.innerText = 'LEVEL 0';
        wrapper.appendChild(this.levelEl);

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-2 gap-3 rotate-45';

        this.buttons = {};
        const corners = ['tl', 'tr', 'bl', 'br'];
        this.colors.forEach((color, i) => {
            const btn = document.createElement('button');
            btn.className = `w-24 h-24 rounded-${corners[i]}-full transition-all duration-200`;
            btn.style.background = this.colorMap[color];
            btn.style.boxShadow = `0 0 20px ${this.colorMap[color]}`;
            btn.onclick = () => this.handleClick(color);
            grid.appendChild(btn);
            this.buttons[color] = btn;
        });

        wrapper.appendChild(grid);
        this.container.appendChild(wrapper);
    }

    showStart() {
        this.levelEl.innerHTML = '<button id="startSimon" class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500">BAŞLA</button>';
        this.container.querySelector('#startSimon').onclick = () => this.nextRound();
    }

    async nextRound() {
        this.level++;
        this.levelEl.innerText = `LEVEL ${this.level}`;
        this.sequence.push(this.colors[Math.floor(Math.random() * 4)]);
        this.playerIndex = 0;
        this.isPlaying = false;

        await this.playSequence();
        this.isPlaying = true;
    }

    async playSequence() {
        await this.sleep(500);
        for (let color of this.sequence) {
            await this.flashButton(color);
            await this.sleep(200);
        }
    }

    flashButton(color) {
        return new Promise(resolve => {
            const btn = this.buttons[color];
            btn.style.transform = 'scale(1.1)';
            btn.style.boxShadow = `0 0 50px ${this.colorMap[color]}`;
            window.Audio?.play('click');
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = `0 0 20px ${this.colorMap[color]}`;
                resolve();
            }, 400);
        });
    }

    sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    handleClick(color) {
        if (!this.isPlaying || !this.isRunning) return;

        this.flashButton(color);

        if (color === this.sequence[this.playerIndex]) {
            this.playerIndex++;
            this.updateScore(10);

            if (this.playerIndex === this.sequence.length) {
                window.Audio?.play('win');
                this.updateScore(this.level * 10);
                setTimeout(() => this.nextRound(), 1000);
            }
        } else {
            window.Audio?.play('gameover');
            this.gameOver(`${this.level} TURA ULAŞTIN!`);
        }
    }
}
