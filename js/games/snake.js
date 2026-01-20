/**
 * Snake Game
 */
import { Game } from './Game.js';

export class SnakeGame extends Game {
    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 400;
        this.canvas.height = 400;
        this.canvas.className = "border-2 border-neon-green shadow-[0_0_15px_#0aff0a] bg-black max-w-full";
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.grid = 20;
        this.cols = this.canvas.width / this.grid;
        this.rows = this.canvas.height / this.grid;

        this.snake = [{ x: 5, y: 5 }];
        this.dir = { x: 1, y: 0 };
        this.nextDir = { x: 1, y: 0 };
        this.food = this.getFreePos();

        this.speed = 0.15;
        this.timer = 0;

        window.addEventListener('keydown', (e) => this.handleKey(e));

        // Mobile swipe support
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - this.touchStartX;
            const dy = e.changedTouches[0].clientY - this.touchStartY;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            if (Math.max(absDx, absDy) < 30) return; // Too short

            if (absDx > absDy) {
                // Horizontal swipe
                if (dx > 0 && this.dir.x === 0) this.nextDir = { x: 1, y: 0 };
                else if (dx < 0 && this.dir.x === 0) this.nextDir = { x: -1, y: 0 };
            } else {
                // Vertical swipe
                if (dy > 0 && this.dir.y === 0) this.nextDir = { x: 0, y: 1 };
                else if (dy < 0 && this.dir.y === 0) this.nextDir = { x: 0, y: -1 };
            }
        });
    }

    handleKey(e) {
        if (!this.isRunning) return;
        if (e.key === 'ArrowUp' && this.dir.y === 0) this.nextDir = { x: 0, y: -1 };
        if (e.key === 'ArrowDown' && this.dir.y === 0) this.nextDir = { x: 0, y: 1 };
        if (e.key === 'ArrowLeft' && this.dir.x === 0) this.nextDir = { x: -1, y: 0 };
        if (e.key === 'ArrowRight' && this.dir.x === 0) this.nextDir = { x: 1, y: 0 };
    }

    update(dt) {
        this.timer += dt;
        if (this.timer > this.speed) {
            this.timer = 0;
            this.move();
        }
    }

    move() {
        this.dir = this.nextDir;
        const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };

        if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows || this.onSnake(head)) {
            return this.gameOver();
        }

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
            this.updateScore(10);
            window.Audio?.play('eat');
            this.food = this.getFreePos();
            this.speed = Math.max(0.05, this.speed * 0.98);
        } else {
            this.snake.pop();
        }
    }

    onSnake(pos) {
        return this.snake.some(s => s.x === pos.x && s.y === pos.y);
    }

    getFreePos() {
        let pos;
        do {
            pos = { x: Math.floor(Math.random() * this.cols), y: Math.floor(Math.random() * this.rows) };
        } while (this.onSnake(pos));
        return pos;
    }

    draw() {
        this.ctx.fillStyle = '#050505';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Food
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.fillRect(this.food.x * this.grid, this.food.y * this.grid, this.grid - 2, this.grid - 2);

        // Snake
        this.ctx.fillStyle = '#0aff0a';
        this.ctx.shadowColor = '#0aff0a';
        this.snake.forEach(s => {
            this.ctx.fillRect(s.x * this.grid, s.y * this.grid, this.grid - 2, this.grid - 2);
        });
        this.ctx.shadowBlur = 0;
    }
}
