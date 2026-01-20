/**
 * Memory Game (Multiplayer)
 */
import { Game } from './Game.js';

export class MemoryGame extends Game {
    init() {
        this.container.innerHTML = '';
        this.showSettings();
    }

    showSettings() {
        const menu = document.createElement('div');
        menu.className = 'flex flex-col items-center gap-6 p-6';
        menu.innerHTML = `
            <h2 class="text-2xl font-display text-neon-purple mb-2">HAFIZA KARTLARI</h2>
            
            <div class="w-full max-w-xs">
                <label class="block text-gray-400 text-sm mb-2">Kart Sayısı</label>
                <div class="flex gap-2">
                    <button data-grid="4" class="grid-btn flex-1 py-2 rounded bg-gray-700 text-white font-bold hover:bg-neon-purple transition-colors border-2 border-transparent">4x4</button>
                    <button data-grid="6" class="grid-btn flex-1 py-2 rounded bg-gray-700 text-white font-bold hover:bg-neon-purple transition-colors border-2 border-transparent">6x6</button>
                    <button data-grid="8" class="grid-btn flex-1 py-2 rounded bg-gray-700 text-white font-bold hover:bg-neon-purple transition-colors border-2 border-transparent">8x8</button>
                </div>
            </div>
            
            <div class="w-full max-w-xs">
                <label class="block text-gray-400 text-sm mb-2">Oyuncu Sayısı</label>
                <div class="flex gap-2">
                    <button data-players="1" class="player-btn flex-1 py-2 rounded bg-gray-700 text-white font-bold hover:bg-neon-blue transition-colors border-2 border-transparent">1</button>
                    <button data-players="2" class="player-btn flex-1 py-2 rounded bg-gray-700 text-white font-bold hover:bg-neon-blue transition-colors border-2 border-transparent">2</button>
                    <button data-players="3" class="player-btn flex-1 py-2 rounded bg-gray-700 text-white font-bold hover:bg-neon-blue transition-colors border-2 border-transparent">3</button>
                    <button data-players="4" class="player-btn flex-1 py-2 rounded bg-gray-700 text-white font-bold hover:bg-neon-blue transition-colors border-2 border-transparent">4</button>
                </div>
            </div>
            
            <button id="startMemory" class="mt-4 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:scale-105 transition-transform shadow-lg">BAŞLA</button>
        `;
        this.container.appendChild(menu);

        this.selectedGrid = 4;
        this.selectedPlayers = 1;

        menu.querySelectorAll('.grid-btn').forEach(btn => {
            btn.onclick = () => {
                menu.querySelectorAll('.grid-btn').forEach(b => b.classList.remove('bg-neon-purple', 'border-neon-purple'));
                btn.classList.add('bg-neon-purple', 'border-neon-purple');
                this.selectedGrid = parseInt(btn.dataset.grid);
            };
        });

        menu.querySelectorAll('.player-btn').forEach(btn => {
            btn.onclick = () => {
                menu.querySelectorAll('.player-btn').forEach(b => b.classList.remove('bg-neon-blue', 'border-neon-blue'));
                btn.classList.add('bg-neon-blue', 'border-neon-blue');
                this.selectedPlayers = parseInt(btn.dataset.players);
            };
        });

        menu.querySelector('[data-grid="4"]').click();
        menu.querySelector('[data-players="1"]').click();

        menu.querySelector('#startMemory').onclick = () => this.startGame();
    }

    startGame() {
        this.container.innerHTML = '';
        this.gridSize = this.selectedGrid;
        this.totalPlayers = this.selectedPlayers;
        this.currentPlayer = 0;
        this.playerScores = Array(this.totalPlayers).fill(0);
        this.playerColors = ['#ff4444', '#4444ff', '#44ff44', '#ffff44'];
        this.flipped = [];
        this.matched = 0;
        this.locked = false;
        this.totalPairs = (this.gridSize * this.gridSize) / 2;

        const emojiPool = ['🚀', '🪐', '👽', '👾', '🤖', '🛸', '⭐', '☄️', '🌙', '🔮', '💎', '🎯', '🎨', '🎭', '🎪', '🎡', '🌈', '🔥', '💫', '🌸', '🍀', '🌺', '🍁', '🌻', '🎃', '🎄', '🎁', '🎈', '🎵', '🎹', '🎸', '🎺'];
        const selectedEmojis = emojiPool.slice(0, this.totalPairs);
        this.cards = [...selectedEmojis, ...selectedEmojis].sort(() => 0.5 - Math.random());

        const scoreboard = document.createElement('div');
        scoreboard.className = 'flex justify-center gap-4 mb-4 flex-wrap';
        for (let i = 0; i < this.totalPlayers; i++) {
            const player = document.createElement('div');
            player.className = 'px-4 py-2 rounded-lg text-white font-bold transition-all';
            player.style.background = this.playerColors[i];
            player.id = `player-${i}`;
            player.innerHTML = `<span class="text-sm opacity-80">P${i + 1}</span> <span id="score-${i}">0</span>`;
            scoreboard.appendChild(player);
        }
        this.container.appendChild(scoreboard);
        this.updatePlayerIndicator();

        const grid = document.createElement('div');
        grid.className = 'grid gap-2';
        grid.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        this.container.appendChild(grid);

        const cardSize = this.gridSize <= 4 ? 'w-16 h-16 md:w-20 md:h-20 text-3xl' : this.gridSize <= 6 ? 'w-12 h-12 md:w-14 md:h-14 text-2xl' : 'w-10 h-10 md:w-12 md:h-12 text-xl';

        this.cards.forEach((emoji, i) => {
            const card = document.createElement('div');
            card.className = `${cardSize} bg-gray-800 rounded-lg cursor-pointer flex items-center justify-center shadow-lg border-2 border-gray-700 hover:border-neon-purple transition-all duration-200`;
            card.innerHTML = `<span class="opacity-0 transition-opacity duration-200">${emoji}</span>`;
            card.onclick = () => this.flip(card, emoji, i);
            grid.appendChild(card);
        });
    }

    updatePlayerIndicator() {
        for (let i = 0; i < this.totalPlayers; i++) {
            const el = document.getElementById(`player-${i}`);
            if (i === this.currentPlayer) {
                el.style.boxShadow = `0 0 20px ${this.playerColors[i]}, 0 0 40px ${this.playerColors[i]}`;
                el.style.transform = 'scale(1.1)';
            } else {
                el.style.boxShadow = 'none';
                el.style.transform = 'scale(1)';
            }
        }
    }

    flip(card, emoji, index) {
        if (this.locked || card.classList.contains('matched') || this.flipped.find(f => f.index === index)) return;

        window.Audio?.play('click');
        card.classList.remove('bg-gray-800', 'border-gray-700');
        card.classList.add('bg-neon-purple', 'border-neon-purple');
        card.querySelector('span').classList.remove('opacity-0');

        this.flipped.push({ card, emoji, index });

        if (this.flipped.length === 2) {
            this.locked = true;
            const [first, second] = this.flipped;

            if (first.emoji === second.emoji) {
                setTimeout(() => {
                    first.card.classList.remove('bg-neon-purple', 'border-neon-purple');
                    second.card.classList.remove('bg-neon-purple', 'border-neon-purple');
                    first.card.classList.add('matched');
                    second.card.classList.add('matched');
                    first.card.style.background = this.playerColors[this.currentPlayer];
                    second.card.style.background = this.playerColors[this.currentPlayer];

                    window.Audio?.play('win');
                    this.playerScores[this.currentPlayer]++;
                    document.getElementById(`score-${this.currentPlayer}`).innerText = this.playerScores[this.currentPlayer];
                    this.updateScore(50);

                    this.flipped = [];
                    this.locked = false;
                    this.matched++;

                    if (this.matched === this.totalPairs) {
                        this.showFinalScores();
                    }
                }, 400);
            } else {
                setTimeout(() => {
                    first.card.classList.remove('bg-neon-purple', 'border-neon-purple');
                    second.card.classList.remove('bg-neon-purple', 'border-neon-purple');
                    first.card.classList.add('bg-gray-800', 'border-gray-700');
                    second.card.classList.add('bg-gray-800', 'border-gray-700');
                    first.card.querySelector('span').classList.add('opacity-0');
                    second.card.querySelector('span').classList.add('opacity-0');

                    this.flipped = [];
                    this.locked = false;

                    this.currentPlayer = (this.currentPlayer + 1) % this.totalPlayers;
                    this.updatePlayerIndicator();
                }, 800);
            }
        }
    }

    showFinalScores() {
        const maxScore = Math.max(...this.playerScores);
        const winners = this.playerScores.map((s, i) => s === maxScore ? i : -1).filter(i => i >= 0);
        setTimeout(() => {
            this.gameOver(winners.length === 1 ? `P${winners[0] + 1} KAZANDI!` : 'BERABERE!');
        }, 1500);
    }
}
