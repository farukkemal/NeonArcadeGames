/**
 * Quantum Fleet (Battleship Clone)
 * Features: Ship placement, turn-based combat, Hunt & Target AI
 */
import { Game } from './Game.js';

export class BattleshipGame extends Game {
    init() {
        this.container.innerHTML = '';
        this.gridSize = 10;
        this.cellSize = 28;
        this.ships = [
            { name: 'Carrier', size: 5, placed: false },
            { name: 'Battleship', size: 4, placed: false },
            { name: 'Cruiser', size: 3, placed: false },
            { name: 'Submarine', size: 3, placed: false },
            { name: 'Destroyer', size: 2, placed: false }
        ];

        this.playerGrid = this.createEmptyGrid();
        this.aiGrid = this.createEmptyGrid();
        this.playerShots = this.createEmptyGrid();
        this.aiShots = this.createEmptyGrid();

        this.aiHits = [];
        this.aiHuntMode = false;
        this.aiTargetQueue = [];

        this.phase = 'placement';
        this.currentShipIndex = 0;
        this.isHorizontal = true;
        this.playerTurn = true;
        this.gameEnded = false;

        this.showPlacementPhase();
    }

    createEmptyGrid() {
        return Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));
    }

    showPlacementPhase() {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex flex-col items-center gap-4 p-4';
        wrapper.innerHTML = `
            <h2 class="text-xl font-display text-cyan-400">GEMİLERİ YERLEŞTİR</h2>
            <div class="flex gap-4 items-start">
                <div id="placementGrid"></div>
                <div class="flex flex-col gap-2">
                    <div id="shipList" class="text-sm"></div>
                    <button id="rotateBtn" class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500">↻ Döndür</button>
                    <button id="randomBtn" class="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-500">🎲 Rastgele</button>
                    <button id="startBtn" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 hidden">▶ BAŞLA</button>
                </div>
            </div>
        `;
        this.container.appendChild(wrapper);

        this.renderPlacementGrid();
        this.updateShipList();

        document.getElementById('rotateBtn').onclick = () => {
            this.isHorizontal = !this.isHorizontal;
        };
        document.getElementById('randomBtn').onclick = () => this.randomPlacement();
        document.getElementById('startBtn').onclick = () => this.startBattle();
    }

    renderPlacementGrid() {
        const gridEl = document.getElementById('placementGrid');
        gridEl.innerHTML = '';
        gridEl.className = 'grid gap-0.5 bg-gray-800 p-2 rounded';
        gridEl.style.gridTemplateColumns = `repeat(${this.gridSize}, ${this.cellSize}px)`;

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cell = document.createElement('div');
                cell.className = 'w-7 h-7 bg-gray-900 border border-cyan-900/50 hover:bg-cyan-900/30 cursor-pointer transition-colors';
                if (this.playerGrid[r][c] > 0) {
                    cell.className = 'w-7 h-7 bg-cyan-600 border border-cyan-400 shadow-[0_0_8px_cyan]';
                }
                cell.onclick = () => this.placeShip(r, c);
                gridEl.appendChild(cell);
            }
        }
    }

    updateShipList() {
        const listEl = document.getElementById('shipList');
        listEl.innerHTML = this.ships.map((ship, i) => `
            <div class="${ship.placed ? 'text-gray-500 line-through' : i === this.currentShipIndex ? 'text-cyan-400 font-bold' : 'text-gray-400'}">
                ${ship.name} (${ship.size})
            </div>
        `).join('');

        const startBtn = document.getElementById('startBtn');
        if (this.ships.every(s => s.placed)) {
            startBtn.classList.remove('hidden');
        }
    }

    canPlaceShip(grid, r, c, size, horizontal) {
        for (let i = 0; i < size; i++) {
            const nr = horizontal ? r : r + i;
            const nc = horizontal ? c + i : c;
            if (nr >= this.gridSize || nc >= this.gridSize || grid[nr][nc] > 0) {
                return false;
            }
        }
        return true;
    }

    placeShip(r, c) {
        if (this.currentShipIndex >= this.ships.length) return;
        const ship = this.ships[this.currentShipIndex];

        if (!this.canPlaceShip(this.playerGrid, r, c, ship.size, this.isHorizontal)) {
            window.Audio?.play('hit');
            return;
        }

        for (let i = 0; i < ship.size; i++) {
            const nr = this.isHorizontal ? r : r + i;
            const nc = this.isHorizontal ? c + i : c;
            this.playerGrid[nr][nc] = this.currentShipIndex + 1;
        }

        ship.placed = true;
        this.currentShipIndex++;
        window.Audio?.play('click');
        this.renderPlacementGrid();
        this.updateShipList();
    }

    randomPlacement() {
        this.playerGrid = this.createEmptyGrid();
        this.ships.forEach(s => s.placed = false);
        this.currentShipIndex = 0;

        for (let ship of this.ships) {
            let placed = false;
            while (!placed) {
                const horizontal = Math.random() < 0.5;
                const r = Math.floor(Math.random() * this.gridSize);
                const c = Math.floor(Math.random() * this.gridSize);
                if (this.canPlaceShip(this.playerGrid, r, c, ship.size, horizontal)) {
                    for (let i = 0; i < ship.size; i++) {
                        const nr = horizontal ? r : r + i;
                        const nc = horizontal ? c + i : c;
                        this.playerGrid[nr][nc] = this.ships.indexOf(ship) + 1;
                    }
                    ship.placed = true;
                    placed = true;
                }
            }
        }
        this.currentShipIndex = this.ships.length;
        window.Audio?.play('win');
        this.renderPlacementGrid();
        this.updateShipList();
    }

    placeAIShips() {
        for (let ship of this.ships) {
            let placed = false;
            while (!placed) {
                const horizontal = Math.random() < 0.5;
                const r = Math.floor(Math.random() * this.gridSize);
                const c = Math.floor(Math.random() * this.gridSize);
                if (this.canPlaceShip(this.aiGrid, r, c, ship.size, horizontal)) {
                    for (let i = 0; i < ship.size; i++) {
                        const nr = horizontal ? r : r + i;
                        const nc = horizontal ? c + i : c;
                        this.aiGrid[nr][nc] = this.ships.indexOf(ship) + 1;
                    }
                    placed = true;
                }
            }
        }
    }

    startBattle() {
        this.phase = 'battle';
        this.placeAIShips();
        this.container.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = 'flex flex-col items-center gap-2 p-2';
        wrapper.innerHTML = `
            <div id="turnIndicator" class="text-lg font-display text-cyan-400">SENİN SIRAN</div>
            <div class="flex gap-6">
                <div class="text-center">
                    <div class="text-xs text-gray-500 mb-1">DÜŞMAN ALANI</div>
                    <div id="attackGrid"></div>
                </div>
                <div class="text-center">
                    <div class="text-xs text-gray-500 mb-1">SENİN ALANI</div>
                    <div id="defenseGrid"></div>
                </div>
            </div>
        `;
        this.container.appendChild(wrapper);
        this.renderBattleGrids();
    }

    renderBattleGrids() {
        // Attack grid (AI's ships, hidden)
        const attackEl = document.getElementById('attackGrid');
        attackEl.innerHTML = '';
        attackEl.className = 'grid gap-0.5 bg-gray-800 p-1 rounded';
        attackEl.style.gridTemplateColumns = `repeat(${this.gridSize}, 24px)`;

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cell = document.createElement('div');
                cell.className = 'w-6 h-6 bg-gray-900 border border-red-900/30 cursor-crosshair transition-all text-xs flex items-center justify-center';

                if (this.playerShots[r][c] === 1) {
                    cell.className = 'w-6 h-6 bg-gray-700 border border-gray-600 text-gray-500';
                    cell.innerText = '○';
                } else if (this.playerShots[r][c] === 2) {
                    cell.className = 'w-6 h-6 bg-red-600 border border-red-400 shadow-[0_0_8px_red] text-white';
                    cell.innerText = '✕';
                } else {
                    cell.onclick = () => this.playerAttack(r, c);
                    cell.onmouseenter = () => cell.classList.add('bg-red-900/30');
                    cell.onmouseleave = () => cell.classList.remove('bg-red-900/30');
                }
                attackEl.appendChild(cell);
            }
        }

        // Defense grid (player's ships)
        const defenseEl = document.getElementById('defenseGrid');
        defenseEl.innerHTML = '';
        defenseEl.className = 'grid gap-0.5 bg-gray-800 p-1 rounded';
        defenseEl.style.gridTemplateColumns = `repeat(${this.gridSize}, 24px)`;

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cell = document.createElement('div');
                const hasShip = this.playerGrid[r][c] > 0;
                const shot = this.aiShots[r][c];

                if (shot === 2) {
                    cell.className = 'w-6 h-6 bg-red-600 border border-red-400 shadow-[0_0_8px_red] text-white text-xs flex items-center justify-center';
                    cell.innerText = '✕';
                } else if (shot === 1) {
                    cell.className = 'w-6 h-6 bg-gray-700 border border-gray-600 text-gray-500 text-xs flex items-center justify-center';
                    cell.innerText = '○';
                } else if (hasShip) {
                    cell.className = 'w-6 h-6 bg-cyan-700 border border-cyan-500';
                } else {
                    cell.className = 'w-6 h-6 bg-gray-900 border border-cyan-900/30';
                }
                defenseEl.appendChild(cell);
            }
        }
    }

    playerAttack(r, c) {
        if (!this.playerTurn || this.gameEnded || this.playerShots[r][c] > 0) return;

        const hit = this.aiGrid[r][c] > 0;
        this.playerShots[r][c] = hit ? 2 : 1;

        if (hit) {
            window.Audio?.play('hit');
            this.updateScore(10);
            if (this.checkWin(this.playerShots, this.aiGrid)) {
                this.gameEnded = true;
                setTimeout(() => this.gameOver('ZAFER! Düşman Yok Edildi!'), 500);
                return;
            }
        } else {
            window.Audio?.play('click');
        }

        this.renderBattleGrids();
        this.playerTurn = false;
        document.getElementById('turnIndicator').innerText = 'DÜŞMAN ATIYOR...';
        document.getElementById('turnIndicator').className = 'text-lg font-display text-red-400';

        setTimeout(() => this.aiAttack(), 1000);
    }

    aiAttack() {
        if (this.gameEnded) return;

        let r, c;

        // Hunt & Target AI
        if (this.aiTargetQueue.length > 0) {
            // Target mode: attack adjacent cells of previous hit
            const target = this.aiTargetQueue.shift();
            r = target.r;
            c = target.c;
        } else {
            // Hunt mode: random attack
            do {
                r = Math.floor(Math.random() * this.gridSize);
                c = Math.floor(Math.random() * this.gridSize);
            } while (this.aiShots[r][c] > 0);
        }

        const hit = this.playerGrid[r][c] > 0;
        this.aiShots[r][c] = hit ? 2 : 1;

        if (hit) {
            window.Audio?.play('gameover');
            // Add adjacent cells to target queue
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (let [dr, dc] of directions) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize && this.aiShots[nr][nc] === 0) {
                    if (!this.aiTargetQueue.some(t => t.r === nr && t.c === nc)) {
                        this.aiTargetQueue.push({ r: nr, c: nc });
                    }
                }
            }

            if (this.checkWin(this.aiShots, this.playerGrid)) {
                this.gameEnded = true;
                setTimeout(() => this.gameOver('YENİLDİN! Filonuz Battı!'), 500);
                return;
            }
        }

        this.renderBattleGrids();
        this.playerTurn = true;
        document.getElementById('turnIndicator').innerText = 'SENİN SIRAN';
        document.getElementById('turnIndicator').className = 'text-lg font-display text-cyan-400';
    }

    checkWin(shots, grid) {
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (grid[r][c] > 0 && shots[r][c] !== 2) {
                    return false;
                }
            }
        }
        return true;
    }
}
