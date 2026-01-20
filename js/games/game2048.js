/**
 * Neon 2048 Game
 */
import { Game } from './Game.js';

export class Game2048 extends Game {
    init() {
        this.container.innerHTML = '';
        this.size = 4;
        this.grid = Array(16).fill(0);
        this.addRandomTile();
        this.addRandomTile();
        this.createUI();

        this.keyHandler = (e) => this.handleKey(e);
        window.addEventListener('keydown', this.keyHandler);
    }

    stop() {
        super.stop();
        window.removeEventListener('keydown', this.keyHandler);
    }

    createUI() {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex flex-col items-center gap-4';

        const gridEl = document.createElement('div');
        gridEl.className = 'grid grid-cols-4 gap-2 p-3 bg-gray-800 rounded-xl';

        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.className = 'w-16 h-16 rounded-lg flex items-center justify-center font-bold text-lg transition-all duration-150';
            cell.id = `cell-${i}`;
            gridEl.appendChild(cell);
        }

        wrapper.appendChild(gridEl);

        const hint = document.createElement('p');
        hint.className = 'text-gray-400 text-sm';
        hint.innerText = 'Ok tuşları veya kaydırma ile oyna';
        wrapper.appendChild(hint);

        this.container.appendChild(wrapper);
        this.updateUI();

        // Mobile swipe support
        this.touchStartX = 0;
        this.touchStartY = 0;
        gridEl.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }, { passive: false });

        gridEl.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - this.touchStartX;
            const dy = e.changedTouches[0].clientY - this.touchStartY;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            if (Math.max(absDx, absDy) < 30) return;

            let dir;
            if (absDx > absDy) {
                dir = dx > 0 ? 'right' : 'left';
            } else {
                dir = dy > 0 ? 'down' : 'up';
            }
            this.move(dir);
        });
    }

    getTileColor(val) {
        const colors = {
            0: ['bg-gray-700', 'text-gray-700'],
            2: ['bg-orange-400', 'text-white'],
            4: ['bg-amber-500', 'text-white'],
            8: ['bg-yellow-500', 'text-white'],
            16: ['bg-lime-500', 'text-white'],
            32: ['bg-green-500', 'text-white'],
            64: ['bg-emerald-500', 'text-white'],
            128: ['bg-cyan-500', 'text-white'],
            256: ['bg-blue-500', 'text-white'],
            512: ['bg-indigo-500', 'text-white'],
            1024: ['bg-violet-500', 'text-white'],
            2048: ['bg-pink-500', 'text-white']
        };
        return colors[val] || ['bg-red-600', 'text-white'];
    }

    updateUI() {
        for (let i = 0; i < 16; i++) {
            const cell = document.getElementById(`cell-${i}`);
            if (!cell) return;
            const val = this.grid[i];
            const [bg, text] = this.getTileColor(val);
            cell.className = `w-16 h-16 rounded-lg flex items-center justify-center font-bold transition-all duration-150 ${bg} ${text}`;
            cell.innerText = val || '';
            cell.style.boxShadow = val ? `0 0 ${Math.min(val / 64, 20)}px currentColor` : 'none';
        }
    }

    addRandomTile() {
        const empty = this.grid.map((v, i) => v === 0 ? i : -1).filter(i => i >= 0);
        if (empty.length === 0) return false;
        const idx = empty[Math.floor(Math.random() * empty.length)];
        this.grid[idx] = Math.random() < 0.9 ? 2 : 4;
        return true;
    }

    slide(row) {
        let arr = row.filter(v => v !== 0);
        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i] === arr[i + 1]) {
                arr[i] *= 2;
                this.updateScore(arr[i]);
                arr.splice(i + 1, 1);
            }
        }
        while (arr.length < 4) arr.push(0);
        return arr;
    }

    move(dir) {
        const oldGrid = [...this.grid];

        if (dir === 'left' || dir === 'right') {
            for (let r = 0; r < 4; r++) {
                let row = this.grid.slice(r * 4, r * 4 + 4);
                if (dir === 'right') row.reverse();
                row = this.slide(row);
                if (dir === 'right') row.reverse();
                for (let c = 0; c < 4; c++) this.grid[r * 4 + c] = row[c];
            }
        } else {
            for (let c = 0; c < 4; c++) {
                let col = [this.grid[c], this.grid[c + 4], this.grid[c + 8], this.grid[c + 12]];
                if (dir === 'down') col.reverse();
                col = this.slide(col);
                if (dir === 'down') col.reverse();
                this.grid[c] = col[0];
                this.grid[c + 4] = col[1];
                this.grid[c + 8] = col[2];
                this.grid[c + 12] = col[3];
            }
        }

        const moved = this.grid.some((v, i) => v !== oldGrid[i]);
        if (moved) {
            window.Audio?.play('click');
            this.addRandomTile();
            this.updateUI();
            if (this.grid.includes(2048)) {
                window.Audio?.play('win');
                this.gameOver('2048 ULAŞTIN!');
            } else if (!this.canMove()) {
                this.gameOver();
            }
        }
    }

    canMove() {
        if (this.grid.includes(0)) return true;
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const i = r * 4 + c;
                if (c < 3 && this.grid[i] === this.grid[i + 1]) return true;
                if (r < 3 && this.grid[i] === this.grid[i + 4]) return true;
            }
        }
        return false;
    }

    handleKey(e) {
        if (!this.isRunning) return;
        const dirs = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
        if (dirs[e.key]) {
            e.preventDefault();
            this.move(dirs[e.key]);
        }
    }
}
