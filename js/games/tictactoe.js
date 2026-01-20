/**
 * Tic-Tac-Toe Game with AI
 */
import { Game } from './Game.js';

export class TicTacToeGame extends Game {
    init() {
        this.container.innerHTML = '';
        this.showModeSelection();
    }

    showModeSelection() {
        const menu = document.createElement('div');
        menu.className = 'flex flex-col items-center gap-4 p-8';
        menu.innerHTML = `
            <h2 class="text-2xl font-display text-neon-blue mb-4">OYUN MODU SEÇ</h2>
            <button id="vsAI" class="w-64 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-lg hover:scale-105 transition-transform">🤖 BİLGİSAYARA KARŞI</button>
            <button id="vsFriend" class="w-64 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-lg hover:scale-105 transition-transform">👥 ARKADAŞINLA OYNA</button>
        `;
        this.container.appendChild(menu);

        menu.querySelector('#vsAI').onclick = () => this.showDifficultySelection();
        menu.querySelector('#vsFriend').onclick = () => this.startGame(false);
    }

    showDifficultySelection() {
        this.container.innerHTML = '';
        const menu = document.createElement('div');
        menu.className = 'flex flex-col items-center gap-4 p-8';
        menu.innerHTML = `
            <h2 class="text-2xl font-display text-neon-blue mb-4">ZORLUK SEÇ</h2>
            <button id="easy" class="w-64 py-3 bg-green-600 text-white font-bold rounded-lg hover:scale-105 transition-transform">😊 KOLAY</button>
            <button id="hard" class="w-64 py-3 bg-red-600 text-white font-bold rounded-lg hover:scale-105 transition-transform">🔥 ZOR (Yenilmez)</button>
        `;
        this.container.appendChild(menu);

        menu.querySelector('#easy').onclick = () => this.startGame(true, 'easy');
        menu.querySelector('#hard').onclick = () => this.startGame(true, 'hard');
    }

    startGame(vsAI, difficulty = 'easy') {
        this.container.innerHTML = '';
        this.vsAI = vsAI;
        this.difficulty = difficulty;
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.gameActive = true;

        const wrapper = document.createElement('div');
        wrapper.className = 'flex flex-col items-center gap-4';

        this.statusEl = document.createElement('div');
        this.statusEl.className = 'text-xl font-display text-neon-blue';
        this.statusEl.innerText = 'Sıra: X';
        wrapper.appendChild(this.statusEl);

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-3 gap-2';
        this.cells = [];

        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('button');
            cell.className = 'w-20 h-20 bg-gray-800 rounded-lg text-4xl font-bold hover:bg-gray-700 transition-colors border-2 border-gray-700';
            cell.onclick = () => this.handleClick(i);
            grid.appendChild(cell);
            this.cells.push(cell);
        }

        wrapper.appendChild(grid);
        this.container.appendChild(wrapper);
    }

    handleClick(i) {
        if (!this.gameActive || this.board[i] || (this.vsAI && this.currentPlayer === 'O')) return;

        this.makeMove(i, this.currentPlayer);

        if (this.checkWin(this.currentPlayer)) {
            this.endGame(`${this.currentPlayer} Kazandı!`);
            return;
        }
        if (this.board.every(c => c)) {
            this.endGame('Berabere!');
            return;
        }

        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.statusEl.innerText = `Sıra: ${this.currentPlayer}`;

        if (this.vsAI && this.currentPlayer === 'O') {
            setTimeout(() => this.aiMove(), 500);
        }
    }

    makeMove(i, player) {
        this.board[i] = player;
        this.cells[i].innerText = player;
        this.cells[i].style.color = player === 'X' ? '#00ffff' : '#ff00ff';
        this.cells[i].style.textShadow = player === 'X' ? '0 0 15px #00ffff' : '0 0 15px #ff00ff';
        window.Audio?.play('click');
    }

    aiMove() {
        if (!this.gameActive) return;

        let move;
        if (this.difficulty === 'hard') {
            move = this.minimax(this.board, 'O').index;
        } else {
            const empty = this.board.map((v, i) => v === null ? i : -1).filter(i => i >= 0);
            move = empty[Math.floor(Math.random() * empty.length)];
        }

        this.makeMove(move, 'O');

        if (this.checkWin('O')) {
            this.endGame('Bilgisayar Kazandı!');
            return;
        }
        if (this.board.every(c => c)) {
            this.endGame('Berabere!');
            return;
        }

        this.currentPlayer = 'X';
        this.statusEl.innerText = 'Sıra: X';
    }

    minimax(board, player) {
        const empty = board.map((v, i) => v === null ? i : -1).filter(i => i >= 0);

        if (this.checkWinBoard(board, 'X')) return { score: -10 };
        if (this.checkWinBoard(board, 'O')) return { score: 10 };
        if (empty.length === 0) return { score: 0 };

        const moves = [];
        for (let i of empty) {
            const newBoard = [...board];
            newBoard[i] = player;
            const result = this.minimax(newBoard, player === 'O' ? 'X' : 'O');
            moves.push({ index: i, score: result.score });
        }

        let best;
        if (player === 'O') {
            best = moves.reduce((a, b) => a.score > b.score ? a : b);
        } else {
            best = moves.reduce((a, b) => a.score < b.score ? a : b);
        }
        return best;
    }

    checkWin(player) {
        return this.checkWinBoard(this.board, player);
    }

    checkWinBoard(board, player) {
        const wins = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        return wins.some(([a, b, c]) => board[a] === player && board[b] === player && board[c] === player);
    }

    endGame(msg) {
        this.gameActive = false;
        this.statusEl.innerText = msg;
        if (msg.includes('X')) {
            this.updateScore(100);
            window.Audio?.play('win');
        }
        setTimeout(() => this.gameOver(msg), 1500);
    }
}
