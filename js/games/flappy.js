/**
 * Flappy Bird Game
 */
import { Game } from './Game.js';

export class FlappyGame extends Game {
    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 320;
        this.canvas.height = 480;
        this.canvas.className = "border-2 border-green-400 shadow-[0_0_20px_#0f0] bg-gray-900 max-w-full cursor-pointer";
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.bird = { x: 80, y: 200, vy: 0, w: 24, h: 18 };
        this.gravity = 800;
        this.jumpForce = -280;
        this.pipes = [];
        this.pipeTimer = 0;
        this.pipeInterval = 1.8;
        this.pipeGap = 120;
        this.pipeSpeed = 120;
        this.gameStarted = false;
        this.bgOffset = 0;

        this.canvas.onclick = () => this.jump();
        window.addEventListener('keydown', (e) => { if (e.code === 'Space') this.jump(); });
    }

    jump() {
        if (!this.isRunning) return;
        if (!this.gameStarted) this.gameStarted = true;
        this.bird.vy = this.jumpForce;
        window.Audio?.play('click');
    }

    update(dt) {
        if (!this.gameStarted) return;

        this.bird.vy += this.gravity * dt;
        // Cap fall speed for better control
        this.bird.vy = Math.min(this.bird.vy, 400);
        this.bird.y += this.bird.vy * dt;

        this.bgOffset = (this.bgOffset + this.pipeSpeed * dt * 0.5) % 40;

        this.pipeTimer += dt;
        if (this.pipeTimer >= this.pipeInterval) {
            this.pipeTimer = 0;
            const gapY = Math.floor(Math.random() * (this.canvas.height - 160 - this.pipeGap)) + 80;
            this.pipes.push({ x: this.canvas.width, gapY, passed: false });
        }

        for (let pipe of this.pipes) {
            pipe.x -= this.pipeSpeed * dt;

            if (!pipe.passed && pipe.x + 40 < this.bird.x) {
                pipe.passed = true;
                this.updateScore(10);
                window.Audio?.play('eat');
            }

            const pipeW = 40;

            // FIX: Hitbox 10% smaller than visual for forgiving collisions
            const hitboxShrink = 0.1;
            const shrinkW = this.bird.w * hitboxShrink;
            const shrinkH = this.bird.h * hitboxShrink;
            const birdRect = {
                x: this.bird.x + shrinkW / 2,
                y: this.bird.y + shrinkH / 2,
                w: this.bird.w - shrinkW,
                h: this.bird.h - shrinkH
            };

            const topPipe = { x: pipe.x, y: 0, w: pipeW, h: pipe.gapY };
            const bottomPipe = { x: pipe.x, y: pipe.gapY + this.pipeGap, w: pipeW, h: this.canvas.height };

            if (this.aabb(birdRect, topPipe) || this.aabb(birdRect, bottomPipe)) {
                this.shake(6, 0.3);
                this.gameOver();
                return;
            }
        }

        this.pipes = this.pipes.filter(p => p.x > -50);

        if (this.bird.y < 0 || this.bird.y + this.bird.h > this.canvas.height) {
            this.shake(6, 0.3);
            this.gameOver();
        }
    }

    aabb(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    draw() {
        const ctx = this.ctx;

        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.strokeStyle = 'rgba(0,255,100,0.1)';
        for (let i = -this.bgOffset; i < this.canvas.width; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, this.canvas.height);
            ctx.stroke();
        }

        for (let pipe of this.pipes) {
            ctx.fillStyle = '#0f0';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#0f0';
            ctx.fillRect(pipe.x, 0, 40, pipe.gapY);
            ctx.fillRect(pipe.x - 4, pipe.gapY - 20, 48, 20);
            ctx.fillRect(pipe.x, pipe.gapY + this.pipeGap, 40, this.canvas.height);
            ctx.fillRect(pipe.x - 4, pipe.gapY + this.pipeGap, 48, 20);
        }
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffd700';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ffd700';
        ctx.fillRect(this.bird.x, this.bird.y, this.bird.w, this.bird.h);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(this.bird.x + 4, this.bird.y + 8, 8, 6);
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.bird.x + 16, this.bird.y + 4, 4, 4);
        ctx.fillStyle = '#000';
        ctx.fillRect(this.bird.x + 18, this.bird.y + 4, 2, 2);
        ctx.shadowBlur = 0;

        if (!this.gameStarted) {
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.font = '16px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText('Tıkla veya SPACE bas', this.canvas.width / 2, this.canvas.height / 2 + 60);
        }

        ctx.fillStyle = '#fff';
        ctx.font = '24px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(this.score.toString(), this.canvas.width / 2, 40);
        ctx.textAlign = 'left';
    }
}
