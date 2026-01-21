/**
 * Neon Tetris
 * Features: Ghost piece, hard drop, next piece preview, glitch line clear
 */
import { Game } from './Game.js';

export class TetrisGame extends Game {
    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 380;
        this.canvas.height = 540;
        this.canvas.className = "border-2 border-purple-500 shadow-[0_0_20px_purple] bg-black max-w-full";
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.cols = 10;
        this.rows = 20;
        this.cellSize = 26;
        this.offsetX = 20;
        this.offsetY = 20;

        this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
        this.colors = ['', '#0ff', '#ff0', '#a0f', '#0f0', '#f00', '#00f', '#f80'];

        this.shapes = [
            [[1, 1, 1, 1]], // I
            [[1, 1], [1, 1]], // O
            [[0, 1, 0], [1, 1, 1]], // T
            [[1, 0, 0], [1, 1, 1]], // L
            [[0, 0, 1], [1, 1, 1]], // J
            [[0, 1, 1], [1, 1, 0]], // S
            [[1, 1, 0], [0, 1, 1]]  // Z
        ];

        this.dropTimer = 0;
        this.dropSpeed = 0.5;
        this.level = 1;
        this.lines = 0;
        this.clearingRows = [];
        this.clearTimer = 0;

        // Lock delay: Grace period before piece locks
        this.lockTimer = 0;
        this.lockDelay = 0.5;
        this.lockMoves = 0;
        this.maxLockMoves = 15;

        this.nextPiece = this.randomPiece();
        this.spawnPiece();

        this.keyHandler = (e) => this.handleKey(e);
        window.addEventListener('keydown', this.keyHandler);
    }

    stop() {
        super.stop();
        window.removeEventListener('keydown', this.keyHandler);
    }

    randomPiece() {
        const idx = Math.floor(Math.random() * this.shapes.length);
        return {
            shape: this.shapes[idx].map(row => [...row]),
            color: idx + 1
        };
    }

    spawnPiece() {
        this.current = this.nextPiece;
        this.nextPiece = this.randomPiece();
        this.pieceX = Math.floor((this.cols - this.current.shape[0].length) / 2);
        this.pieceY = 0;

        if (!this.canPlace(this.pieceX, this.pieceY, this.current.shape)) {
            this.gameOver();
        }
    }

    canPlace(x, y, shape) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const nx = x + c, ny = y + r;
                    if (nx < 0 || nx >= this.cols || ny >= this.rows) return false;
                    if (ny >= 0 && this.board[ny][nx]) return false;
                }
            }
        }
        return true;
    }

    rotate(shape) {
        const rows = shape.length, cols = shape[0].length;
        const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                rotated[c][rows - 1 - r] = shape[r][c];
            }
        }
        return rotated;
    }

    handleKey(e) {
        if (!this.isRunning || this.clearingRows.length > 0) return;

        if (e.key === 'ArrowLeft') {
            if (this.canPlace(this.pieceX - 1, this.pieceY, this.current.shape)) {
                this.pieceX--;
                window.Audio?.play('click');
            }
        }
        if (e.key === 'ArrowRight') {
            if (this.canPlace(this.pieceX + 1, this.pieceY, this.current.shape)) {
                this.pieceX++;
                window.Audio?.play('click');
            }
        }
        if (e.key === 'ArrowDown') {
            this.dropTimer = this.dropSpeed;
        }
        if (e.key === 'ArrowUp') {
            // Hard drop
            while (this.canPlace(this.pieceX, this.pieceY + 1, this.current.shape)) {
                this.pieceY++;
                this.updateScore(2);
            }
            this.lockPiece();
            window.Audio?.play('hit');
        }
        if (e.key === 'z' || e.key === 'Z') {
            this.tryRotate();
        }
    }

    // Wall kick system - tries multiple positions when rotating near walls
    tryRotate() {
        const rotated = this.rotate(this.current.shape);

        // Wall kick offsets to try (SRS-like)
        const kicks = [
            [0, 0],   // No offset
            [-1, 0],  // Left
            [1, 0],   // Right
            [0, -1],  // Up
            [-2, 0],  // Far left (for I piece)
            [2, 0]    // Far right (for I piece)
        ];

        for (const [dx, dy] of kicks) {
            if (this.canPlace(this.pieceX + dx, this.pieceY + dy, rotated)) {
                this.current.shape = rotated;
                this.pieceX += dx;
                this.pieceY += dy;
                this.lockMoves++;
                window.Audio?.play('click');
                return;
            }
        }
    }

    lockPiece() {
        for (let r = 0; r < this.current.shape.length; r++) {
            for (let c = 0; c < this.current.shape[r].length; c++) {
                if (this.current.shape[r][c]) {
                    const ny = this.pieceY + r;
                    const nx = this.pieceX + c;
                    if (ny >= 0 && ny < this.rows && nx >= 0 && nx < this.cols) {
                        this.board[ny][nx] = this.current.color;
                    }
                }
            }
        }
        this.checkLines();
        this.spawnPiece();
    }

    checkLines() {
        this.clearingRows = [];
        for (let r = 0; r < this.rows; r++) {
            if (this.board[r].every(cell => cell !== 0)) {
                this.clearingRows.push(r);
            }
        }
        if (this.clearingRows.length > 0) {
            this.clearTimer = 0.4;
            window.Audio?.play('win');
        }
    }

    clearLines() {
        this.clearingRows.sort((a, b) => b - a).forEach(row => {
            this.board.splice(row, 1);
            this.board.unshift(Array(this.cols).fill(0));
        });

        const cleared = this.clearingRows.length;
        const points = [0, 100, 300, 500, 800];
        this.updateScore(points[cleared] * this.level);
        this.lines += cleared;
        this.level = Math.floor(this.lines / 10) + 1;
        this.dropSpeed = Math.max(0.1, 0.5 - this.level * 0.04);

        // Screen shake based on lines cleared
        this.shake(3 + cleared * 2, 0.2 + cleared * 0.05);

        this.clearingRows = [];
    }

    getGhostY() {
        let ghostY = this.pieceY;
        while (this.canPlace(this.pieceX, ghostY + 1, this.current.shape)) {
            ghostY++;
        }
        return ghostY;
    }

    update(dt) {
        if (this.clearingRows.length > 0) {
            this.clearTimer -= dt;
            if (this.clearTimer <= 0) {
                this.clearLines();
            }
            return;
        }

        this.dropTimer += dt;

        // Check if piece can move down
        const canMoveDown = this.canPlace(this.pieceX, this.pieceY + 1, this.current.shape);

        if (this.dropTimer >= this.dropSpeed) {
            this.dropTimer = 0;
            if (canMoveDown) {
                this.pieceY++;
                this.lockTimer = 0; // Reset lock timer when moving down
            }
        }

        // Lock delay system
        if (!canMoveDown) {
            this.lockTimer += dt;
            if (this.lockTimer >= this.lockDelay || this.lockMoves >= this.maxLockMoves) {
                this.lockPiece();
                this.lockTimer = 0;
                this.lockMoves = 0;
            }
        } else {
            this.lockTimer = 0;
        }
    }

    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = '#0a0a10';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw board
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const x = this.offsetX + c * this.cellSize;
                const y = this.offsetY + r * this.cellSize;

                if (this.board[r][c]) {
                    ctx.fillStyle = this.colors[this.board[r][c]];
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = this.colors[this.board[r][c]];
                    ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
                } else {
                    ctx.strokeStyle = '#222';
                    ctx.strokeRect(x, y, this.cellSize, this.cellSize);
                }
            }
        }
        ctx.shadowBlur = 0;

        // Draw clearing rows with glitch effect
        if (this.clearingRows.length > 0) {
            this.clearingRows.forEach(row => {
                const y = this.offsetY + row * this.cellSize;
                ctx.fillStyle = '#fff';
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#fff';
                ctx.fillRect(this.offsetX + Math.random() * 10 - 5, y, this.cols * this.cellSize, this.cellSize);
            });
            ctx.shadowBlur = 0;
        }

        // Draw ghost piece
        const ghostY = this.getGhostY();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = this.colors[this.current.color];
        ctx.lineWidth = 2;
        for (let r = 0; r < this.current.shape.length; r++) {
            for (let c = 0; c < this.current.shape[r].length; c++) {
                if (this.current.shape[r][c]) {
                    const x = this.offsetX + (this.pieceX + c) * this.cellSize;
                    const y = this.offsetY + (ghostY + r) * this.cellSize;
                    ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
                }
            }
        }
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;

        // Draw current piece
        ctx.fillStyle = this.colors[this.current.color];
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.colors[this.current.color];
        for (let r = 0; r < this.current.shape.length; r++) {
            for (let c = 0; c < this.current.shape[r].length; c++) {
                if (this.current.shape[r][c]) {
                    const x = this.offsetX + (this.pieceX + c) * this.cellSize;
                    const y = this.offsetY + (this.pieceY + r) * this.cellSize;
                    ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
                }
            }
        }
        ctx.shadowBlur = 0;

        // Draw next piece panel
        ctx.fillStyle = '#111';
        ctx.fillRect(255, 50, 60, 80);
        ctx.strokeStyle = '#a0f';
        ctx.strokeRect(255, 50, 60, 80);
        ctx.fillStyle = '#a0f';
        ctx.font = '10px Orbitron';
        ctx.fillText('NEXT', 268, 45);

        ctx.fillStyle = this.colors[this.nextPiece.color];
        ctx.shadowBlur = 6;
        ctx.shadowColor = this.colors[this.nextPiece.color];
        const previewX = 260, previewY = 60;
        for (let r = 0; r < this.nextPiece.shape.length; r++) {
            for (let c = 0; c < this.nextPiece.shape[r].length; c++) {
                if (this.nextPiece.shape[r][c]) {
                    ctx.fillRect(previewX + c * 12, previewY + r * 12, 10, 10);
                }
            }
        }
        ctx.shadowBlur = 0;

        // UI
        ctx.fillStyle = '#fff';
        ctx.font = '12px Orbitron';
        ctx.fillText(`LEVEL: ${this.level}`, 255, 160);
        ctx.fillText(`LINES: ${this.lines}`, 255, 180);
        ctx.fillText(`SCORE`, 255, 210);
        ctx.fillStyle = '#0ff';
        ctx.font = '16px Orbitron';
        ctx.fillText(this.score, 255, 230);

        // Controls hint
        ctx.fillStyle = '#666';
        ctx.font = '9px Inter';
        ctx.fillText('←→ Move', 255, 420);
        ctx.fillText('↑ Hard Drop', 255, 434);
        ctx.fillText('Z Rotate', 255, 448);
    }
}
