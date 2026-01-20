/**
 * Neon Runner (Endless Runner - Chrome Dino style)
 * Features: Jump/duck, obstacles, parallax background, speed scaling
 */
import { Game } from './Game.js';

export class RunnerGame extends Game {
    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 500;
        this.canvas.height = 300;
        this.canvas.className = "border-2 border-orange-500 shadow-[0_0_20px_orange] bg-black max-w-full";
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.groundY = 240;
        this.player = {
            x: 60,
            y: this.groundY,
            w: 30, h: 50,
            vy: 0,
            jumping: false,
            ducking: false
        };

        this.gravity = 1500;
        this.jumpForce = -500;
        this.baseSpeed = 300;
        this.speed = this.baseSpeed;
        this.distance = 0;

        this.obstacles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1.5;

        this.buildings = this.generateBuildings();
        this.trail = [];

        this.keyDownHandler = (e) => this.handleKeyDown(e);
        this.keyUpHandler = (e) => this.handleKeyUp(e);
        window.addEventListener('keydown', this.keyDownHandler);
        window.addEventListener('keyup', this.keyUpHandler);

        // Mobile: Tap anywhere to jump
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.player.jumping && !this.player.ducking) {
                this.player.vy = this.jumpForce;
                this.player.jumping = true;
                window.Audio?.play('click');
            }
        }, { passive: false });
    }

    stop() {
        super.stop();
        window.removeEventListener('keydown', this.keyDownHandler);
        window.removeEventListener('keyup', this.keyUpHandler);
    }

    generateBuildings() {
        const buildings = [];
        for (let i = 0; i < 15; i++) {
            buildings.push({
                x: i * 80,
                w: 40 + Math.random() * 50,
                h: 60 + Math.random() * 100,
                layer: Math.floor(Math.random() * 3) // 0 = far, 2 = near
            });
        }
        return buildings;
    }

    handleKeyDown(e) {
        if (!this.isRunning) return;
        if ((e.key === ' ' || e.key === 'ArrowUp') && !this.player.jumping && !this.player.ducking) {
            this.player.vy = this.jumpForce;
            this.player.jumping = true;
            window.Audio?.play('click');
        }
        if (e.key === 'ArrowDown' && !this.player.jumping) {
            this.player.ducking = true;
            this.player.h = 25;
            this.player.y = this.groundY + 25;
        }
    }

    handleKeyUp(e) {
        if (e.key === 'ArrowDown') {
            this.player.ducking = false;
            this.player.h = 50;
            this.player.y = this.groundY;
        }
    }

    spawnObstacle() {
        const type = Math.random() < 0.6 ? 'spike' : 'drone';
        if (type === 'spike') {
            this.obstacles.push({
                type: 'spike',
                x: this.canvas.width + 50,
                y: this.groundY + 20,
                w: 25, h: 30
            });
        } else {
            this.obstacles.push({
                type: 'drone',
                x: this.canvas.width + 50,
                y: this.groundY - 50 - Math.random() * 40,
                w: 35, h: 20
            });
        }
    }

    update(dt) {
        this.distance += this.speed * dt;

        // Speed increase every 100 points
        const newSpeed = this.baseSpeed + Math.floor(this.score / 100) * 15;
        this.speed = Math.min(600, newSpeed);

        // Score
        this.updateScore(Math.floor(this.speed * dt / 10), false);
        this.scoreDisplay.innerText = this.score;

        // Player physics
        if (this.player.jumping) {
            this.player.vy += this.gravity * dt;
            this.player.y += this.player.vy * dt;
            if (this.player.y >= this.groundY) {
                this.player.y = this.groundY;
                this.player.jumping = false;
                this.player.vy = 0;
            }
        }

        // Trail
        this.trail.push({ x: this.player.x, y: this.player.y + this.player.h / 2 });
        if (this.trail.length > 15) this.trail.shift();

        // Spawn obstacles
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnInterval = Math.max(0.6, 1.5 - this.score / 500);
            this.spawnObstacle();
        }

        // Move obstacles
        this.obstacles.forEach(o => o.x -= this.speed * dt);
        this.obstacles = this.obstacles.filter(o => o.x > -50);

        // Move buildings (parallax)
        this.buildings.forEach(b => {
            const parallaxSpeed = (b.layer + 1) * 0.3;
            b.x -= this.speed * dt * parallaxSpeed;
            if (b.x + b.w < 0) {
                b.x = this.canvas.width + Math.random() * 100;
                b.h = 60 + Math.random() * 100;
            }
        });

        // Collision - with slightly smaller hitbox for forgiveness
        const hitboxShrink = 4;
        const playerBox = {
            x: this.player.x + hitboxShrink,
            y: this.player.y + hitboxShrink,
            w: this.player.w - hitboxShrink * 2,
            h: this.player.h - hitboxShrink * 2
        };
        for (let o of this.obstacles) {
            if (this.aabb(playerBox, o)) {
                this.shake(10, 0.3);
                this.gameOver();
                return;
            }
        }
    }

    aabb(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    draw() {
        const ctx = this.ctx;

        // Sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0a0015');
        gradient.addColorStop(0.5, '#1a0030');
        gradient.addColorStop(1, '#2a0040');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Neon sun
        ctx.fillStyle = '#ff6600';
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ff6600';
        ctx.beginPath();
        ctx.arc(this.canvas.width - 80, 60, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Buildings (parallax layers)
        for (let layer = 0; layer < 3; layer++) {
            const alpha = 0.2 + layer * 0.15;
            ctx.fillStyle = `rgba(50, 0, 80, ${alpha})`;
            this.buildings.filter(b => b.layer === layer).forEach(b => {
                ctx.fillRect(b.x, this.groundY + 50 - b.h, b.w, b.h);
                // Windows
                ctx.fillStyle = `rgba(255, 100, 255, ${0.3 + layer * 0.1})`;
                for (let wy = this.groundY + 40 - b.h; wy < this.groundY + 30; wy += 15) {
                    for (let wx = b.x + 5; wx < b.x + b.w - 5; wx += 10) {
                        if (Math.random() > 0.3) ctx.fillRect(wx, wy, 4, 8);
                    }
                }
                ctx.fillStyle = `rgba(50, 0, 80, ${alpha})`;
            });
        }

        // Ground
        ctx.fillStyle = '#ff00ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff00ff';
        ctx.fillRect(0, this.groundY + 50, this.canvas.width, 3);
        ctx.shadowBlur = 0;

        // Grid lines on ground
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
        for (let i = 0; i < 20; i++) {
            const x = ((i * 50 - this.distance * 0.5) % this.canvas.width + this.canvas.width) % this.canvas.width;
            ctx.beginPath();
            ctx.moveTo(x, this.groundY + 50);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }

        // Player trail
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#0ff';
        ctx.beginPath();
        this.trail.forEach((p, i) => {
            ctx.globalAlpha = i / this.trail.length;
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // Player (silhouette)
        ctx.fillStyle = '#0ff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#0ff';
        ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
        // Head
        if (!this.player.ducking) {
            ctx.beginPath();
            ctx.arc(this.player.x + this.player.w / 2, this.player.y - 8, 10, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Obstacles
        this.obstacles.forEach(o => {
            if (o.type === 'spike') {
                ctx.fillStyle = '#f44';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#f44';
                // Triangle spike
                ctx.beginPath();
                ctx.moveTo(o.x + o.w / 2, o.y - o.h);
                ctx.lineTo(o.x, o.y);
                ctx.lineTo(o.x + o.w, o.y);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.fillStyle = '#f0f';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#f0f';
                ctx.fillRect(o.x, o.y, o.w, o.h);
                // Propeller effect
                ctx.fillStyle = '#fff';
                ctx.fillRect(o.x - 5, o.y - 3, o.w + 10, 2);
            }
        });
        ctx.shadowBlur = 0;

        // UI
        ctx.fillStyle = '#fff';
        ctx.font = '14px Orbitron';
        ctx.fillText(`DISTANCE: ${this.score}m`, 10, 25);
        ctx.fillText(`SPEED: ${Math.floor(this.speed)}`, this.canvas.width - 100, 25);
    }
}
