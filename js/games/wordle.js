/**
 * Kelime Korsanı (Turkish Wordle)
 */
import { Game } from './Game.js';

export class WordleGame extends Game {
    init() {
        this.container.innerHTML = '';
        this.words = ['KALEM', 'MASAL', 'KITAP', 'ARABA', 'BAHCE', 'DENIZ', 'GUNES', 'BULUT', 'CICEK', 'AGACI', 'KAPIS', 'DUVAR', 'TAVAN', 'ZEMIN', 'RESIM', 'TABLA', 'SANKI', 'BILGI', 'KALIP', 'CILEK'];
        this.targetWord = this.words[Math.floor(Math.random() * this.words.length)].toUpperCase();
        this.wordLength = 5;
        this.maxGuesses = 6;
        this.currentGuess = '';
        this.guesses = [];
        this.gameEnded = false;
        this.createUI();
    }

    createUI() {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex flex-col items-center gap-4';

        const grid = document.createElement('div');
        grid.className = 'grid gap-1';
        for (let r = 0; r < this.maxGuesses; r++) {
            const row = document.createElement('div');
            row.className = 'flex gap-1';
            for (let c = 0; c < this.wordLength; c++) {
                const cell = document.createElement('div');
                cell.className = 'w-12 h-14 bg-gray-800 border-2 border-gray-700 rounded flex items-center justify-center text-xl font-bold text-white';
                cell.id = `cell-${r}-${c}`;
                row.appendChild(cell);
            }
            grid.appendChild(row);
        }
        wrapper.appendChild(grid);

        const keyboard = document.createElement('div');
        keyboard.className = 'flex flex-col gap-1 mt-4';
        const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
        rows.forEach((row, ri) => {
            const rowEl = document.createElement('div');
            rowEl.className = 'flex gap-1 justify-center';
            if (ri === 2) {
                const enterBtn = document.createElement('button');
                enterBtn.className = 'px-3 py-2 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-500';
                enterBtn.innerText = '↵';
                enterBtn.onclick = () => this.submitGuess();
                rowEl.appendChild(enterBtn);
            }
            for (let char of row) {
                const key = document.createElement('button');
                key.className = 'w-8 h-10 bg-gray-700 text-white rounded font-bold hover:bg-gray-600 text-sm';
                key.innerText = char;
                key.id = `key-${char}`;
                key.onclick = () => this.addLetter(char);
                rowEl.appendChild(key);
            }
            if (ri === 2) {
                const delBtn = document.createElement('button');
                delBtn.className = 'px-3 py-2 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-500';
                delBtn.innerText = '⌫';
                delBtn.onclick = () => this.deleteLetter();
                rowEl.appendChild(delBtn);
            }
            keyboard.appendChild(rowEl);
        });
        wrapper.appendChild(keyboard);

        this.container.appendChild(wrapper);
    }

    addLetter(letter) {
        if (this.gameEnded || this.currentGuess.length >= this.wordLength) return;
        this.currentGuess += letter;
        window.Audio?.play('click');
        this.updateGridRow();
    }

    deleteLetter() {
        if (this.gameEnded || this.currentGuess.length === 0) return;
        this.currentGuess = this.currentGuess.slice(0, -1);
        this.updateGridRow();
    }

    updateGridRow() {
        const row = this.guesses.length;
        for (let c = 0; c < this.wordLength; c++) {
            const cell = document.getElementById(`cell-${row}-${c}`);
            if (cell) {
                cell.innerText = this.currentGuess[c] || '';
                cell.style.borderColor = this.currentGuess[c] ? '#a855f7' : '#374151';
            }
        }
    }

    submitGuess() {
        if (this.gameEnded || this.currentGuess.length !== this.wordLength) return;

        const row = this.guesses.length;
        const guess = this.currentGuess.toUpperCase();
        const target = this.targetWord;

        for (let c = 0; c < this.wordLength; c++) {
            const cell = document.getElementById(`cell-${row}-${c}`);
            const key = document.getElementById(`key-${guess[c]}`);
            let color = 'bg-gray-700';

            if (guess[c] === target[c]) {
                color = 'bg-green-600';
                if (cell) cell.style.boxShadow = '0 0 15px #22c55e';
                if (key) key.className = 'w-8 h-10 bg-green-600 text-white rounded font-bold text-sm';
            } else if (target.includes(guess[c])) {
                color = 'bg-yellow-500';
                if (cell) cell.style.boxShadow = '0 0 10px #eab308';
                if (key && !key.className.includes('green')) key.className = 'w-8 h-10 bg-yellow-500 text-white rounded font-bold text-sm';
            } else {
                if (key) key.className = 'w-8 h-10 bg-gray-900 text-gray-500 rounded font-bold text-sm';
            }

            if (cell) cell.className = `w-12 h-14 ${color} border-2 border-transparent rounded flex items-center justify-center text-xl font-bold text-white`;
        }

        this.guesses.push(guess);
        this.currentGuess = '';

        if (guess === target) {
            this.gameEnded = true;
            window.Audio?.play('win');
            this.updateScore((this.maxGuesses - this.guesses.length + 1) * 100);
            setTimeout(() => this.gameOver('TEBRİKLER!'), 1000);
        } else if (this.guesses.length >= this.maxGuesses) {
            this.gameEnded = true;
            setTimeout(() => this.gameOver(`Kelime: ${target}`), 500);
        } else {
            window.Audio?.play('hit');
        }
    }
}
