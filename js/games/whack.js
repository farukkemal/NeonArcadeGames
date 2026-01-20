/**
 * Whack-a-Light Game (Level Based)
 */
import { Game } from './Game.js';

export class WhackGame extends Game {
    init() {
        this.level = 1;
        this.grid = [];
        this.activeIdx = -1;
        this.spawnTime = 1.2;
        this.timer = 0;
        this.gameTimer = 30;
        this.hits = 0;
        this.targetHits = 15;
        this.gameActive = false;

        this.container.innerHTML = '';
        this.showLevelStart();
    }

    showLevelStart() {
        this.container.innerHTML = `
            <div class="flex flex-col items-center gap-4 p-8 text-center">
                <h2 class="text-3xl font-display text-neon-green">LEVEL ${this.level}</h2>
                <p class="text-gray-400">${this.gameTimer} saniyede ${this.targetHits} hedef vur!</p>
                <button id="startLevel" class="mt-4 px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:scale-105 transition-transform shadow-lg">BAŞLA</button>
            </div>
        `;
        this.container.querySelector('#startLevel').onclick = () => this.startLevel();
    }

    startLevel() {
        this.container.innerHTML = '';
        this.hits = 0;
        this.gameTimer = 30;
        this.gameActive = true;

        const wrapper = document.createElement('div');
        wrapper.className = 'flex flex-col items-center gap-4';

        this.statusEl = document.createElement('div');
        this.statusEl.className = 'flex gap-8 text-lg font-display';
        this.statusEl.innerHTML = `
            <span>⏱️ <span id="timer">${this.gameTimer}</span>s</span>
            <span>🎯 <span id="hits">${this.hits}</span>/${this.targetHits}</span>
        `;
        wrapper.appendChild(this.statusEl);

        const gridEl = document.createElement('div');
        gridEl.className = 'grid grid-cols-3 gap-3';
        this.grid = [];

        for (let i = 0; i < 9; i++) {
            const light = document.createElement('button');
            light.className = 'w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-700 transition-all duration-150';
            light.onclick = () => this.hitLight(i);
            gridEl.appendChild(light);
            this.grid.push(light);
        }

        wrapper.appendChild(gridEl);
        this.container.appendChild(wrapper);
        this.spawnLight();
    }

    spawnLight() {
        if (!this.gameActive) return;

        if (this.activeIdx >= 0) {
            this.grid[this.activeIdx].className = 'w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-700 transition-all duration-150';
        }

        this.activeIdx = Math.floor(Math.random() * 9);
        this.grid[this.activeIdx].className = 'w-16 h-16 rounded-full bg-red-500 border-2 border-red-400 shadow-[0_0_25px_red] scale-110 transition-all duration-150';
    }

    hitLight(idx) {
        if (!this.gameActive || idx !== this.activeIdx) return;

        this.hits++;
        this.updateScore(10 * this.level);
        window.Audio?.play('hit');
        document.getElementById('hits').innerText = this.hits;

        if (this.hits >= this.targetHits) {
            this.levelComplete();
        } else {
            this.spawnLight();
        }
    }

    levelComplete() {
        this.gameActive = false;
        window.Audio?.play('win');

        if (this.level >= 5) {
            this.gameOver('TÜM SEVİYELER TAMAM!');
        } else {
            this.level++;
            this.targetHits += 3;
            this.spawnTime = Math.max(0.5, this.spawnTime - 0.15);
            this.showLevelStart();
        }
    }

    update(dt) {
        if (!this.gameActive) return;

        this.timer += dt;
        if (this.timer >= this.spawnTime) {
            this.timer = 0;
            this.spawnLight();
        }

        this.gameTimer -= dt;
        const timerEl = document.getElementById('timer');
        if (timerEl) timerEl.innerText = Math.ceil(this.gameTimer);

        if (this.gameTimer <= 0) {
            this.gameActive = false;
            this.gameOver(`Level ${this.level} - ${this.hits}/${this.targetHits}`);
        }
    }
}
