/**
 * Cyber Defenders (Space Invaders Clone)
 * Features: Enemy AI, destructible shields, boss battles, particle effects
 */
import { Game, ParticleSystem } from './Game.js';

export class SpaceInvadersGame extends Game {
    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 400;
        this.canvas.height = 500;
        this.canvas.className = "border-2 border-cyan-400 shadow-[0_0_20px_cyan] bg-black max-w-full";
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.particles = new ParticleSystem();
        this.wave = 1;
        this.setupWave();
        this.setupPlayer();
        this.setupShields();

        this.keyHandler = (e) => this.handleKey(e);
        window.addEventListener('keydown', this.keyHandler);
    }

    stop() {
        super.stop();
        window.removeEventListener('keydown', this.keyHandler);
    }

    setupPlayer() {
        this.player = {
            x: this.canvas.width / 2 - 15,
            y: this.canvas.height - 40,
            w: 30, h: 20,
            speed: 200,
            moveDir: 0
        };
        this.playerBullets = [];
        this.shootCooldown = 0;
    }

    setupShields() {
        this.shields = [];
        const shieldWidth = 50, shieldHeight = 30;
        const positions = [60, 175, 290];

        positions.forEach(x => {
            const shield = {
                x, y: this.canvas.height - 100,
                w: shieldWidth, h: shieldHeight,
                pixels: []
            };
            // Create pixel grid for shield
            for (let py = 0; py < shieldHeight; py += 4) {
                for (let px = 0; px < shieldWidth; px += 4) {
                    shield.pixels.push({ x: px, y: py, alive: true });
                }
            }
            this.shields.push(shield);
        });
    }

    setupWave() {
        this.enemies = [];
        this.enemyBullets = [];
        this.enemyDir = 1;
        this.enemyDropTimer = 0;
        this.enemyMoveTimer = 0;
        this.boss = null;

        // Check if boss wave
        if (this.wave % 3 === 0) {
            this.boss = {
                x: this.canvas.width / 2 - 40,
                y: 30,
                w: 80, h: 40,
                hp: 10 + this.wave,
                maxHp: 10 + this.wave,
                dir: 1,
                shootTimer: 0
            };
        } else {
            // Regular enemies
            const rows = Math.min(3 + Math.floor(this.wave / 2), 5);
            const cols = 8;
            const spacing = 40;
            const startX = (this.canvas.width - cols * spacing) / 2;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    this.enemies.push({
                        x: startX + c * spacing,
                        y: 40 + r * 35,
                        w: 25, h: 20,
                        type: r % 2 === 0 ? 'green' : 'purple',
                        alive: true
                    });
                }
            }
        }

        this.baseEnemySpeed = 0.3 + this.wave * 0.05;
    }

    handleKey(e) {
        if (!this.isRunning) return;
        if (e.key === 'ArrowLeft') this.player.moveDir = -1;
        if (e.key === 'ArrowRight') this.player.moveDir = 1;
        if (e.key === ' ' || e.key === 'ArrowUp') this.shoot();
    }

    shoot() {
        if (this.shootCooldown > 0) return;
        this.playerBullets.push({
            x: this.player.x + this.player.w / 2 - 2,
            y: this.player.y,
            w: 4, h: 12
        });
        this.shootCooldown = 0.3;
        window.Audio?.play('click');
    }

    update(dt) {
        this.particles.update(dt);
        this.shootCooldown -= dt;

        // Player movement
        this.player.x += this.player.moveDir * this.player.speed * dt;
        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.w, this.player.x));
        this.player.moveDir *= 0.9; // Friction

        // Player bullets
        this.playerBullets.forEach(b => b.y -= 400 * dt);
        this.playerBullets = this.playerBullets.filter(b => b.y > -20);

        if (this.boss) {
            this.updateBoss(dt);
        } else {
            this.updateEnemies(dt);
        }

        // Enemy bullets
        this.enemyBullets.forEach(b => b.y += 200 * dt);
        this.enemyBullets = this.enemyBullets.filter(b => b.y < this.canvas.height + 20);

        // Collision detection
        this.checkCollisions();
    }

    updateBoss(dt) {
        this.boss.x += this.boss.dir * 100 * dt;
        if (this.boss.x <= 20 || this.boss.x >= this.canvas.width - this.boss.w - 20) {
            this.boss.dir *= -1;
        }

        this.boss.shootTimer += dt;
        if (this.boss.shootTimer > 0.8) {
            this.boss.shootTimer = 0;
            // Triple shot
            for (let i = -1; i <= 1; i++) {
                this.enemyBullets.push({
                    x: this.boss.x + this.boss.w / 2 + i * 15,
                    y: this.boss.y + this.boss.h,
                    w: 4, h: 10
                });
            }
        }
    }

    updateEnemies(dt) {
        const aliveCount = this.enemies.filter(e => e.alive).length;
        if (aliveCount === 0) {
            this.wave++;
            this.setupWave();
            window.Audio?.play('win');
            return;
        }

        const speedMult = 1 + (this.enemies.length - aliveCount) * 0.03;
        this.enemyMoveTimer += dt * this.baseEnemySpeed * speedMult;

        if (this.enemyMoveTimer > 0.5) {
            this.enemyMoveTimer = 0;

            let shouldDrop = false;
            this.enemies.forEach(e => {
                if (!e.alive) return;
                if ((e.x < 10 && this.enemyDir < 0) || (e.x > this.canvas.width - e.w - 10 && this.enemyDir > 0)) {
                    shouldDrop = true;
                }
            });

            if (shouldDrop) {
                this.enemies.forEach(e => e.y += 15);
                this.enemyDir *= -1;
            }

            this.enemies.forEach(e => {
                if (e.alive) e.x += this.enemyDir * 15;
            });
        }

        // Enemy shooting
        this.enemies.forEach(e => {
            if (e.alive && Math.random() < 0.002) {
                this.enemyBullets.push({
                    x: e.x + e.w / 2 - 2,
                    y: e.y + e.h,
                    w: 4, h: 10
                });
            }
        });

        // Check if enemies reached bottom
        if (this.enemies.some(e => e.alive && e.y > this.canvas.height - 100)) {
            this.gameOver();
        }
    }

    checkCollisions() {
        // Player bullets vs enemies
        for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
            const b = this.playerBullets[bi];
            if (!b) continue;

            for (const e of this.enemies) {
                if (e.alive && this.aabb(b, e)) {
                    e.alive = false;
                    this.playerBullets.splice(bi, 1);
                    this.particles.explode(e.x + e.w / 2, e.y + e.h / 2, e.type === 'green' ? '#0f0' : '#a0f', 20);
                    this.updateScore(10 * this.wave);
                    window.Audio?.play('hit');
                    break;
                }
            }

            // vs Boss
            if (this.boss && this.playerBullets[bi] && this.aabb(b, this.boss)) {
                this.playerBullets.splice(bi, 1);
                this.boss.hp--;
                this.particles.emit(b.x, b.y, '#f44', 8);
                this.shake(3, 0.1);
                window.Audio?.play('hit');
                if (this.boss.hp <= 0) {
                    this.particles.explode(this.boss.x + this.boss.w / 2, this.boss.y + this.boss.h / 2, '#ff0', 50);
                    this.shake(10, 0.5);
                    this.updateScore(100 * this.wave);
                    window.Audio?.play('win');
                    this.wave++;
                    this.boss = null;
                    this.setupWave();
                }
            }
        }

        // NEW: Bullet-bullet collision (player bullets destroy enemy bullets mid-air)
        for (let pi = this.playerBullets.length - 1; pi >= 0; pi--) {
            for (let ei = this.enemyBullets.length - 1; ei >= 0; ei--) {
                if (this.playerBullets[pi] && this.enemyBullets[ei] &&
                    this.aabb(this.playerBullets[pi], this.enemyBullets[ei])) {
                    const px = this.playerBullets[pi].x;
                    const py = this.playerBullets[pi].y;
                    this.playerBullets.splice(pi, 1);
                    this.enemyBullets.splice(ei, 1);
                    this.particles.emit(px, py, '#ff0', 10);
                    this.updateScore(5);
                    break;
                }
            }
        }

        // Player bullets vs shields
        for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
            const b = this.playerBullets[bi];
            if (!b) continue;
            for (const s of this.shields) {
                for (const p of s.pixels) {
                    if (p.alive && this.aabb(b, { x: s.x + p.x, y: s.y + p.y, w: 4, h: 4 })) {
                        p.alive = false;
                        this.playerBullets.splice(bi, 1);
                        break;
                    }
                }
            }
        }

        // Enemy bullets vs player
        for (let bi = this.enemyBullets.length - 1; bi >= 0; bi--) {
            if (this.aabb(this.enemyBullets[bi], this.player)) {
                this.enemyBullets.splice(bi, 1);
                this.shake(8, 0.3);
                this.particles.explode(this.player.x + this.player.w / 2, this.player.y, '#0ff', 30);
                this.gameOver();
                return;
            }
        }

        // Enemy bullets vs shields
        for (let bi = this.enemyBullets.length - 1; bi >= 0; bi--) {
            const b = this.enemyBullets[bi];
            if (!b) continue;
            for (const s of this.shields) {
                for (const p of s.pixels) {
                    if (p.alive && this.aabb(b, { x: s.x + p.x, y: s.y + p.y, w: 4, h: 4 })) {
                        p.alive = false;
                        this.enemyBullets.splice(bi, 1);
                        break;
                    }
                }
            }
        }
    }

    aabb(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Stars background
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 73) % this.canvas.width;
            const y = (i * 137 + performance.now() * 0.01) % this.canvas.height;
            ctx.fillRect(x, y, 1, 1);
        }

        // Draw shields
        this.shields.forEach(s => {
            ctx.fillStyle = '#0ff';
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#0ff';
            s.pixels.forEach(p => {
                if (p.alive) {
                    ctx.fillRect(s.x + p.x, s.y + p.y, 4, 4);
                }
            });
        });
        ctx.shadowBlur = 0;

        // Draw player (triangle ship)
        ctx.fillStyle = '#0ff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#0ff';
        ctx.beginPath();
        ctx.moveTo(this.player.x + this.player.w / 2, this.player.y);
        ctx.lineTo(this.player.x, this.player.y + this.player.h);
        ctx.lineTo(this.player.x + this.player.w, this.player.y + this.player.h);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw player bullets
        ctx.fillStyle = '#0ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#0ff';
        this.playerBullets.forEach(b => {
            ctx.fillRect(b.x, b.y, b.w, b.h);
        });
        ctx.shadowBlur = 0;

        // Draw enemies
        this.enemies.forEach(e => {
            if (!e.alive) return;
            ctx.fillStyle = e.type === 'green' ? '#0f0' : '#a0f';
            ctx.shadowBlur = 10;
            ctx.shadowColor = e.type === 'green' ? '#0f0' : '#a0f';
            // Simple enemy shape
            ctx.fillRect(e.x + 5, e.y, e.w - 10, e.h - 5);
            ctx.fillRect(e.x, e.y + 5, e.w, e.h - 10);
            // Eyes
            ctx.fillStyle = '#f00';
            ctx.fillRect(e.x + 6, e.y + 8, 4, 4);
            ctx.fillRect(e.x + e.w - 10, e.y + 8, 4, 4);
        });
        ctx.shadowBlur = 0;

        // Draw boss
        if (this.boss) {
            ctx.fillStyle = '#f0f';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#f0f';
            ctx.fillRect(this.boss.x, this.boss.y, this.boss.w, this.boss.h);
            // Boss eye
            ctx.fillStyle = '#f00';
            ctx.fillRect(this.boss.x + this.boss.w / 2 - 8, this.boss.y + 15, 16, 8);
            ctx.shadowBlur = 0;

            // HP bar
            ctx.fillStyle = '#333';
            ctx.fillRect(this.boss.x, this.boss.y - 10, this.boss.w, 6);
            ctx.fillStyle = '#f00';
            ctx.fillRect(this.boss.x, this.boss.y - 10, this.boss.w * (this.boss.hp / this.boss.maxHp), 6);
        }

        // Draw enemy bullets
        ctx.fillStyle = '#f44';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#f44';
        this.enemyBullets.forEach(b => {
            ctx.fillRect(b.x, b.y, b.w, b.h);
        });
        ctx.shadowBlur = 0;

        // Draw particles
        this.particles.draw(ctx);

        // UI
        ctx.fillStyle = '#fff';
        ctx.font = '14px Orbitron';
        ctx.fillText(`WAVE: ${this.wave}`, 10, 25);
        ctx.fillText(`SCORE: ${this.score}`, this.canvas.width - 120, 25);
    }
}
