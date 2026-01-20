/**
 * Glitch Sweeper (Minesweeper Clone)
 * Features: Flood Fill algorithm, first-click protection, flag system
 */
import { Game } from './Game.js';

export class MinesweeperGame extends Game {
    init() {
        this.container.innerHTML = '';
        this.showDifficultyMenu();
    }

    showDifficultyMenu() {
        const menu = document.createElement('div');
        menu.className = 'flex flex-col items-center gap-4 p-6';
        menu.innerHTML = `
            <h2 class="text-2xl font-display text-green-400">GLITCH SWEEPER</h2>
            <p class="text-gray-400 text-sm">Sistem hatalarını temizle</p>
            <div class="flex gap-3">
                <button data-diff="easy" class="px-6 py-3 bg-green-600 text-white font-bold rounded hover:bg-green-500">KOLAY<br><span class="text-xs opacity-70">9x9 • 10 Bug</span></button>
                <button data-diff="medium" class="px-6 py-3 bg-yellow-600 text-white font-bold rounded hover:bg-yellow-500">ORTA<br><span class="text-xs opacity-70">16x16 • 40 Bug</span></button>
                <button data-diff="hard" class="px-6 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-500">ZOR<br><span class="text-xs opacity-70">16x30 • 99 Bug</span></button>
            </div>
        `;
        this.container.appendChild(menu);

        menu.querySelectorAll('button').forEach(btn => {
            btn.onclick = () => this.startGame(btn.dataset.diff);
        });
    }

    startGame(difficulty) {
        const configs = {
            easy: { rows: 9, cols: 9, mines: 10, cellSize: 28 },
            medium: { rows: 16, cols: 16, mines: 40, cellSize: 24 },
            hard: { rows: 16, cols: 30, mines: 99, cellSize: 20 }
        };

        const config = configs[difficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.mineCount = config.mines;
        this.cellSize = config.cellSize;

        this.grid = [];
        this.revealed = [];
        this.flagged = [];
        this.minesPlaced = false;
        this.gameOver_ = false;
        this.flagsUsed = 0;
        this.tilesRevealed = 0;
        this.totalSafe = this.rows * this.cols - this.mineCount;

        for (let r = 0; r < this.rows; r++) {
            this.grid[r] = Array(this.cols).fill(0);
            this.revealed[r] = Array(this.cols).fill(false);
            this.flagged[r] = Array(this.cols).fill(false);
        }

        this.container.innerHTML = '';
        this.renderUI();
    }

    placeMines(safeR, safeC) {
        let placed = 0;
        while (placed < this.mineCount) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);

            // First-click protection: don't place mine on first click or adjacent
            const isSafe = Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1;

            if (this.grid[r][c] !== -1 && !isSafe) {
                this.grid[r][c] = -1;
                placed++;
            }
        }

        // Calculate numbers
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === -1) continue;
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.grid[nr][nc] === -1) {
                            count++;
                        }
                    }
                }
                this.grid[r][c] = count;
            }
        }
        this.minesPlaced = true;
    }

    renderUI() {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex flex-col items-center gap-2';

        const header = document.createElement('div');
        header.className = 'flex justify-between items-center w-full px-2 text-sm font-mono';
        header.innerHTML = `
            <div class="text-red-400">🐛 <span id="mineCount">${this.mineCount - this.flagsUsed}</span></div>
            <button id="restartBtn" class="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 text-yellow-400">🔄</button>
            <div class="text-green-400">✓ <span id="progress">${this.tilesRevealed}/${this.totalSafe}</span></div>
        `;
        wrapper.appendChild(header);

        const gridEl = document.createElement('div');
        gridEl.id = 'mineGrid';
        gridEl.className = 'grid gap-0.5 bg-gray-800 p-1 rounded select-none';
        gridEl.style.gridTemplateColumns = `repeat(${this.cols}, ${this.cellSize}px)`;
        gridEl.oncontextmenu = (e) => e.preventDefault();
        wrapper.appendChild(gridEl);

        this.container.appendChild(wrapper);

        document.getElementById('restartBtn').onclick = () => this.init();
        this.renderGrid();
    }

    renderGrid() {
        const gridEl = document.getElementById('mineGrid');
        gridEl.innerHTML = '';

        const numberColors = ['', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6', '#f59e0b', '#06b6d4', '#000', '#888'];

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement('div');
                const size = this.cellSize;
                cell.style.width = size + 'px';
                cell.style.height = size + 'px';
                cell.className = 'flex items-center justify-center font-bold text-xs cursor-pointer transition-all';

                if (this.revealed[r][c]) {
                    const val = this.grid[r][c];
                    if (val === -1) {
                        cell.className += ' bg-red-600 text-white';
                        cell.innerText = '🐛';
                    } else if (val === 0) {
                        cell.className += ' bg-gray-700';
                    } else {
                        cell.className += ' bg-gray-700';
                        cell.style.color = numberColors[val];
                        cell.style.textShadow = `0 0 5px ${numberColors[val]}`;
                        cell.innerText = val;
                    }
                } else if (this.flagged[r][c]) {
                    cell.className += ' bg-gray-900 border border-red-500';
                    cell.innerText = '🚩';
                } else {
                    cell.className += ' bg-gray-900 border border-green-900/50 hover:bg-green-900/30';
                    cell.onmousedown = (e) => this.handleClick(r, c, e.button);
                }

                gridEl.appendChild(cell);
            }
        }

        document.getElementById('mineCount').innerText = this.mineCount - this.flagsUsed;
        document.getElementById('progress').innerText = `${this.tilesRevealed}/${this.totalSafe}`;
    }

    handleClick(r, c, button) {
        if (this.gameOver_ || this.revealed[r][c]) return;

        if (button === 2) {
            // Right click - flag
            this.flagged[r][c] = !this.flagged[r][c];
            this.flagsUsed += this.flagged[r][c] ? 1 : -1;
            window.Audio?.play('click');
        } else {
            // Left click - reveal
            if (this.flagged[r][c]) return;

            if (!this.minesPlaced) {
                this.placeMines(r, c);
            }

            if (this.grid[r][c] === -1) {
                this.revealAll();
                this.gameOver_ = true;
                window.Audio?.play('gameover');
                setTimeout(() => this.gameOver('SYSTEM CRASH!'), 500);
                return;
            }

            this.floodFill(r, c);
            window.Audio?.play('click');

            if (this.tilesRevealed === this.totalSafe) {
                this.gameOver_ = true;
                this.updateScore(this.mineCount * 10);
                window.Audio?.play('win');
                setTimeout(() => this.gameOver('SYSTEM CLEANED!'), 500);
                return;
            }
        }

        this.renderGrid();
    }

    // Optimized iterative Flood Fill (prevents stack overflow)
    floodFill(startR, startC) {
        const stack = [[startR, startC]];

        while (stack.length > 0) {
            const [r, c] = stack.pop();

            if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) continue;
            if (this.revealed[r][c] || this.flagged[r][c]) continue;

            this.revealed[r][c] = true;
            this.tilesRevealed++;

            if (this.grid[r][c] === 0) {
                // Add all 8 neighbors to stack
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr !== 0 || dc !== 0) {
                            stack.push([r + dr, c + dc]);
                        }
                    }
                }
            }
        }
    }

    revealAll() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === -1) {
                    this.revealed[r][c] = true;
                }
            }
        }
        this.renderGrid();
    }
}
