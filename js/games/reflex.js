/**
 * Reflex Test Game
 */
import { Game } from './Game.js';

export class ReflexGame extends Game {
    init() {
        this.container.innerHTML = '';
        this.state = 'idle';
        this.bestTime = Infinity;
        this.attempts = 0;

        this.wrapper = document.createElement('div');
        this.wrapper.className = 'w-full h-64 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300';
        this.container.appendChild(this.wrapper);

        this.showIdle();
        this.wrapper.onclick = () => this.handleClick();
    }

    showIdle() {
        this.state = 'idle';
        this.wrapper.style.background = 'linear-gradient(135deg, #1a1a2e, #16213e)';
        this.wrapper.innerHTML = `
            <div class="text-center">
                <h2 class="text-3xl font-display text-neon-blue mb-4">REFLEKS TESTİ</h2>
                <p class="text-gray-400 mb-6">Başlamak için tıkla</p>
                <div class="text-6xl">🏎️</div>
            </div>
        `;
    }

    showWaiting() {
        this.state = 'waiting';
        this.waitTime = (Math.random() * 3 + 2) * 1000;
        this.wrapper.style.background = 'linear-gradient(135deg, #8B0000, #4a0000)';
        this.wrapper.innerHTML = `
            <div class="text-center">
                <h2 class="text-4xl font-display text-red-300 animate-pulse">BEKLE...</h2>
                <p class="text-red-200/60 mt-4">Yeşile dönünce tıkla!</p>
            </div>
        `;
        this.startTime = performance.now();
    }

    showActive() {
        this.state = 'active';
        this.startTime = performance.now();
        this.wrapper.style.background = 'linear-gradient(135deg, #00ff00, #00aa00)';
        this.wrapper.innerHTML = `
            <div class="text-center">
                <h2 class="text-5xl font-display text-white drop-shadow-lg">TIKLA!</h2>
            </div>
        `;
        window.Audio?.play('win');
    }

    showResult(time) {
        this.state = 'result';
        this.attempts++;
        if (time < this.bestTime) this.bestTime = time;
        this.updateScore(Math.max(0, Math.floor(500 - time)));

        const rating = time < 200 ? '🏆 EFSANE!' : time < 300 ? '⚡ HARİKA!' : time < 400 ? '👍 İYİ' : '🐢 Daha Hızlı Ol!';

        this.wrapper.style.background = 'linear-gradient(135deg, #1a1a2e, #16213e)';
        this.wrapper.innerHTML = `
            <div class="text-center">
                <h2 class="text-2xl font-display text-neon-blue mb-2">TEPKİ SÜRESİ</h2>
                <div class="text-6xl font-mono text-neon-green mb-4" style="text-shadow: 0 0 20px #0aff0a;">${Math.round(time)} <span class="text-2xl">ms</span></div>
                <p class="text-2xl mb-4">${rating}</p>
                <p class="text-gray-400">En İyi: ${this.bestTime === Infinity ? '-' : Math.round(this.bestTime) + ' ms'}</p>
                <p class="text-gray-500 mt-4 text-sm">Tekrar denemek için tıkla</p>
            </div>
        `;
    }

    showEarlyClick() {
        this.state = 'result';
        this.wrapper.style.background = 'linear-gradient(135deg, #ff4444, #aa0000)';
        this.wrapper.innerHTML = `
            <div class="text-center">
                <h2 class="text-3xl font-display text-white mb-4">⚠️ HATALI ÇIKIŞ!</h2>
                <p class="text-white/80">Çok erken tıkladın!</p>
                <p class="text-white/60 mt-4 text-sm">Tekrar denemek için tıkla</p>
            </div>
        `;
        window.Audio?.play('gameover');
    }

    handleClick() {
        switch (this.state) {
            case 'idle':
            case 'result':
                this.showWaiting();
                break;
            case 'waiting':
                this.showEarlyClick();
                break;
            case 'active':
                const time = performance.now() - this.startTime;
                this.showResult(time);
                break;
        }
    }

    update(dt) {
        if (this.state === 'waiting') {
            if (performance.now() - this.startTime >= this.waitTime) {
                this.showActive();
            }
        }
    }
}
