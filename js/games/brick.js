/**
 * Brick Breaker Game
 */
import { Game, ParticleSystem } from './Game.js';

export class BrickBreakerGame extends Game {
    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 480;
        this.canvas.height = 400;
        this.canvas.className = "border-2 border-yellow-400 shadow-[0_0_20px_yellow] bg-black max-w-full";
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.level = 1;
        this.particles = new ParticleSystem();
        this.setupLevel();

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.paddle.x = e.clientX - rect.left - this.paddle.w / 2;
            this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.w, this.paddle.x));
        });

        this.canvas.addEventListener('click', () => {
            if (!this.ball.launched) this.ball.launched = true;
        });
    }

    setupLevel() {
        this.paddle = { w: 80, h: 10, x: 200, y: 370, color: '#ffff00' };
        const baseSpeed = 180 + (this.level - 1) * 20;
        this.ball = { x: 240, y: 350, r: 6, dx: baseSpeed, dy: -baseSpeed, color: '#ffffff', launched: false };
        this.bricks = this.generateBricks();
        this.lives = 3;
    }

    generateBricks() {
        const bricks = [];
        const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#1dd1a1', '#5f27cd'];
        const rows = 3 + Math.min(2, this.level - 1);
        const cols = 8;
        const bw = 50, bh = 18, gap = 4;
        const offsetX = (this.canvas.width - cols * (bw + gap)) / 2;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                bricks.push({
                    x: offsetX + c * (bw + gap),
                    y: 40 + r * (bh + gap),
                    w: bw, h: bh,
                    color: colors[(r + c) % colors.length],
                    alive: true
                });
            }
        }
        return bricks;
    }

    update(dt) {
        this.particles.update(dt);

        if (!this.ball.launched) {
            this.ball.x = this.paddle.x + this.paddle.w / 2;
            this.ball.y = this.paddle.y - this.ball.r - 2;
            return;
        }

        this.ball.x += this.ball.dx * dt;
        this.ball.y += this.ball.dy * dt;

        // Wall collisions
        if (this.ball.x <= this.ball.r) {
            this.ball.x = this.ball.r;
            this.ball.dx = Math.abs(this.ball.dx);
        }
        if (this.ball.x >= this.canvas.width - this.ball.r) {
            this.ball.x = this.canvas.width - this.ball.r;
            this.ball.dx = -Math.abs(this.ball.dx);
        }
        if (this.ball.y <= this.ball.r) {
            this.ball.y = this.ball.r;
            this.ball.dy = Math.abs(this.ball.dy);
        }

        // Paddle collision - FIX: Push ball to surface, angle-based bounce
        if (this.ball.dy > 0 &&
            this.ball.y + this.ball.r >= this.paddle.y &&
            this.ball.y - this.ball.r <= this.paddle.y + this.paddle.h &&
            this.ball.x >= this.paddle.x - this.ball.r &&
            this.ball.x <= this.paddle.x + this.paddle.w + this.ball.r) {

            // Push ball to paddle surface (prevents stuck ball)
            this.ball.y = this.paddle.y - this.ball.r - 1;

            // Calculate angle based on hit position (-1 to 1, 0 = center)
            const hitPos = (this.ball.x - (this.paddle.x + this.paddle.w / 2)) / (this.paddle.w / 2);

            // Angle range: 150° (left edge) to 30° (right edge)
            const angle = Math.PI * (0.75 - hitPos * 0.4);
            const speed = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);

            this.ball.dx = Math.cos(angle) * speed;
            this.ball.dy = -Math.abs(Math.sin(angle) * speed);

            window.Audio?.play('hit');
        }

        // Brick collisions
        for (let brick of this.bricks) {
            if (!brick.alive) continue;
            if (this.ball.x + this.ball.r > brick.x &&
                this.ball.x - this.ball.r < brick.x + brick.w &&
                this.ball.y + this.ball.r > brick.y &&
                this.ball.y - this.ball.r < brick.y + brick.h) {
                brick.alive = false;

                // Determine collision side for proper bounce
                const overlapLeft = (this.ball.x + this.ball.r) - brick.x;
                const overlapRight = (brick.x + brick.w) - (this.ball.x - this.ball.r);
                const overlapTop = (this.ball.y + this.ball.r) - brick.y;
                const overlapBottom = (brick.y + brick.h) - (this.ball.y - this.ball.r);

                const minOverlapX = Math.min(overlapLeft, overlapRight);
                const minOverlapY = Math.min(overlapTop, overlapBottom);

                if (minOverlapX < minOverlapY) {
                    this.ball.dx *= -1;
                } else {
                    this.ball.dy *= -1;
                }

                this.particles.explode(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color, 15);
                this.updateScore(10 * this.level);
                window.Audio?.play('hit');
            }
        }

        // Ball out of bounds
        if (this.ball.y > this.canvas.height + 20) {
            this.lives--;
            this.shake(8, 0.3); // Screen shake on life loss
            window.Audio?.play('gameover');
            if (this.lives <= 0) {
                this.gameOver();
            } else {
                this.ball.launched = false;
            }
        }

        // Level complete
        if (this.bricks.every(b => !b.alive)) {
            if (this.level >= 5) {
                this.gameOver('TÜM SEVİYELER TAMAM!');
            } else {
                this.level++;
                this.showLevelStart();
            }
        }
    }

    showLevelStart() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '24px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(`LEVEL ${this.level}`, this.canvas.width / 2, this.canvas.height / 2);
        setTimeout(() => this.setupLevel(), 1500);
    }

    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Bricks
        for (let brick of this.bricks) {
            if (!brick.alive) continue;
            ctx.fillStyle = brick.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = brick.color;
            ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
        }
        ctx.shadowBlur = 0;

        // Particles
        this.particles.draw(ctx);

        // Paddle
        ctx.fillStyle = this.paddle.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.paddle.color;
        ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h);

        // Ball
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
        ctx.fillStyle = this.ball.color;
        ctx.shadowColor = this.ball.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // UI
        ctx.fillStyle = '#fff';
        ctx.font = '14px Orbitron';
        ctx.textAlign = 'left';
        ctx.fillText(`LEVEL: ${this.level}`, 10, 25);
        ctx.fillText(`LIVES: ${'❤️'.repeat(this.lives)}`, this.canvas.width - 100, 25);

        if (!this.ball.launched) {
            ctx.textAlign = 'center';
            ctx.fillText('Tıkla ve başla!', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
}
