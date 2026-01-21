/**
 * Gravity Shift (Gravity Flipping Runner)
 * Features: Auto-run, gravity flip only when grounded, platforms and spikes
 */
import { Game, ParticleSystem } from './Game.js';

export class GravityGame extends Game {
    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 450;
        this.canvas.height = 400;
        this.canvas.className = "border-2 border-cyan-500 shadow-[0_0_20px_cyan] bg-black max-w-full";
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.particles = new ParticleSystem();

        // Physics
        this.gravity = 1200;
        this.runSpeed = 200;
        this.distance = 0;

        // Player
        this.player = {
            x: 80,
            y: this.canvas.height / 2,
            width: 25,
            height: 35,
            vy: 0,
            grounded: false,
            onCeiling: false
        };

        // World boundaries
        this.groundY = this.canvas.height - 40;
        this.ceilingY = 40;

        // Obstacles and platforms
        this.obstacles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1.5;

        // Initial platforms
        this.spawnObstacle();

        // Input handlers
        this.handleInput = (e) => {
            e.preventDefault();
            if (this.isRunning) {
                this.flipGravity();
            }
        };

        this.canvas.addEventListener('mousedown', this.handleInput);
        this.canvas.addEventListener('touchstart', this.handleInput, { passive: false });

        this.keyHandler = (e) => {
            if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') && this.isRunning) {
                e.preventDefault();
                this.flipGravity();
            }
        };
        window.addEventListener('keydown', this.keyHandler);
    }

    stop() {
        super.stop();
        this.canvas.removeEventListener('mousedown', this.handleInput);
        this.canvas.removeEventListener('touchstart', this.handleInput);
        window.removeEventListener('keydown', this.keyHandler);
    }

    flipGravity() {
        // Only flip when touching ground or ceiling
        if (this.player.grounded || this.player.onCeiling) {
            this.gravity *= -1;
            this.player.vy = this.gravity * 0.3;
            this.player.grounded = false;
            this.player.onCeiling = false;

            // Particles on flip
            this.particles.emit(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height / 2,
                '#0ff', 15
            );
            window.Audio?.play('click');
        }
    }

    spawnObstacle() {
        const type = Math.random();

        if (type < 0.4) {
            // Ground spike
            this.obstacles.push({
                type: 'spike',
                x: this.canvas.width + 50,
                y: this.groundY,
                width: 25,
                height: 30,
                surface: 'ground'
            });
        } else if (type < 0.8) {
            // Ceiling spike
            this.obstacles.push({
                type: 'spike',
                x: this.canvas.width + 50,
                y: this.ceilingY - 30,
                width: 25,
                height: 30,
                surface: 'ceiling'
            });
        } else {
            // Gap in floor or ceiling
            const onGround = Math.random() < 0.5;
            this.obstacles.push({
                type: 'gap',
                x: this.canvas.width + 50,
                y: onGround ? this.groundY : this.ceilingY,
                width: 80,
                height: 40,
                surface: onGround ? 'ground' : 'ceiling'
            });
        }
    }

    update(dt) {
        this.particles.update(dt);
        this.distance += this.runSpeed * dt;

        // Increase speed over time
        this.runSpeed = Math.min(400, 200 + this.distance / 100);

        // Score
        this.updateScore(Math.floor(this.runSpeed * dt / 10), false);
        this.score = Math.floor(this.distance / 10);
        this.scoreDisplay.innerText = this.score;

        // Apply gravity
        this.player.vy += this.gravity * dt;
        this.player.y += this.player.vy * dt;

        // Ground collision
        this.player.grounded = false;
        this.player.onCeiling = false;

        // Check if there's a gap at player position
        let hasGroundGap = false;
        let hasCeilingGap = false;

        this.obstacles.forEach(o => {
            if (o.type === 'gap' &&
                this.player.x + this.player.width > o.x &&
                this.player.x < o.x + o.width) {
                if (o.surface === 'ground') hasGroundGap = true;
                if (o.surface === 'ceiling') hasCeilingGap = true;
            }
        });

        // Ground/Ceiling boundaries
        if (this.gravity > 0) {
            // Normal gravity - falling down
            if (!hasGroundGap && this.player.y + this.player.height >= this.groundY) {
                this.player.y = this.groundY - this.player.height;
                this.player.vy = 0;
                this.player.grounded = true;
            }
            // Fall through gap
            if (hasGroundGap && this.player.y > this.canvas.height + 50) {
                this.shake(10, 0.3);
                this.gameOver('FELL INTO THE VOID!');
                return;
            }
        } else {
            // Inverted gravity - going up
            if (!hasCeilingGap && this.player.y <= this.ceilingY) {
                this.player.y = this.ceilingY;
                this.player.vy = 0;
                this.player.onCeiling = true;
            }
            // Fall through ceiling gap
            if (hasCeilingGap && this.player.y < -50) {
                this.shake(10, 0.3);
                this.gameOver('FELL INTO THE VOID!');
                return;
            }
        }

        // Move obstacles
        this.obstacles.forEach(o => o.x -= this.runSpeed * dt);
        this.obstacles = this.obstacles.filter(o => o.x > -100);

        // Spawn new obstacles
        this.spawnTimer += dt;
        const adjustedInterval = Math.max(0.8, this.spawnInterval - this.distance / 2000);
        if (this.spawnTimer >= adjustedInterval) {
            this.spawnTimer = 0;
            this.spawnObstacle();
        }

        // Collision with spikes
        for (let o of this.obstacles) {
            if (o.type === 'spike') {
                // Simplified spike hitbox
                const spikeBox = {
                    x: o.x + 5,
                    y: o.surface === 'ground' ? o.y - o.height + 10 : o.y + 10,
                    width: o.width - 10,
                    height: o.height - 10
                };

                if (this.aabb(this.player, spikeBox)) {
                    this.shake(15, 0.4);
                    window.Audio?.play('gameover');
                    this.gameOver('SPIKED!');
                    return;
                }
            }
        }
    }

    aabb(a, b) {
        return a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y;
    }

    draw() {
        const ctx = this.ctx;

        // Background
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#001020');
        gradient.addColorStop(0.5, '#002040');
        gradient.addColorStop(1, '#001020');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.save();
        this.applyShake(ctx);

        // Draw ground
        ctx.fillStyle = '#0ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#0ff';
        ctx.fillRect(0, this.groundY, this.canvas.width, 3);

        // Draw ceiling
        ctx.fillRect(0, this.ceilingY, this.canvas.width, 3);
        ctx.shadowBlur = 0;

        // Draw floor/ceiling fill
        ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.fillRect(0, this.groundY, this.canvas.width, 40);
        ctx.fillRect(0, 0, this.canvas.width, this.ceilingY);

        // Draw obstacles
        this.obstacles.forEach(o => {
            if (o.type === 'spike') {
                ctx.fillStyle = '#f44';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#f44';

                ctx.beginPath();
                if (o.surface === 'ground') {
                    // Upward spike
                    ctx.moveTo(o.x + o.width / 2, o.y - o.height);
                    ctx.lineTo(o.x, o.y);
                    ctx.lineTo(o.x + o.width, o.y);
                } else {
                    // Downward spike
                    ctx.moveTo(o.x + o.width / 2, o.y + o.height);
                    ctx.lineTo(o.x, o.y);
                    ctx.lineTo(o.x + o.width, o.y);
                }
                ctx.closePath();
                ctx.fill();
            } else if (o.type === 'gap') {
                // Draw gap as missing section
                ctx.fillStyle = '#001020';
                if (o.surface === 'ground') {
                    ctx.fillRect(o.x, this.groundY - 5, o.width, 50);
                } else {
                    ctx.fillRect(o.x, 0, o.width, this.ceilingY + 5);
                }
            }
        });
        ctx.shadowBlur = 0;

        // Draw player
        const playerColor = this.gravity > 0 ? '#0ff' : '#f0f';
        ctx.fillStyle = playerColor;
        ctx.shadowBlur = 15;
        ctx.shadowColor = playerColor;

        // Player body
        ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

        // Eye (indicates gravity direction)
        ctx.fillStyle = '#fff';
        const eyeY = this.gravity > 0 ? this.player.y + 8 : this.player.y + this.player.height - 12;
        ctx.fillRect(this.player.x + 15, eyeY, 6, 6);

        ctx.shadowBlur = 0;

        // Particles
        this.particles.draw(ctx);

        ctx.restore();

        // UI
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Orbitron';
        ctx.textAlign = 'left';
        ctx.fillText(`DISTANCE: ${this.score}m`, 15, 25);

        // Gravity indicator
        ctx.fillStyle = this.gravity > 0 ? '#0ff' : '#f0f';
        ctx.font = '12px Orbitron';
        ctx.fillText(this.gravity > 0 ? '↓ GRAVITY' : '↑ GRAVITY', this.canvas.width - 100, 25);

        // Instructions
        if (this.score < 50) {
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '12px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText('TAP TO FLIP GRAVITY', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
}
