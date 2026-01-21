/**
 * Cyber Golf (2D Mini Golf) - Enhanced Physics Engine
 * Features: Robust physics, level array system, hole vacuum, power indicator
 */
import { Game, ParticleSystem } from './Game.js';

export class GolfGame extends Game {
    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 450;
        this.canvas.height = 450;
        this.canvas.className = "border-2 border-green-500 shadow-[0_0_20px_#0f0] bg-black max-w-full";
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.particles = new ParticleSystem();

        // Physics constants
        this.friction = 0.985;           // Per-frame friction
        this.minVelocity = 2;            // Ball stops below this speed
        this.maxHoleSpeed = 80;          // Max speed to enter hole
        this.bounceEnergy = 0.75;        // Energy retained after bounce
        this.maxPower = 500;             // Maximum shot power (velocity)
        this.powerMultiplier = 4;        // Distance to power conversion (3x sensitivity)
        this.maxDragDistance = 120;      // Visual clamp for aim line

        // Ball state
        this.ball = { x: 0, y: 0, vx: 0, vy: 0, radius: 10 };
        this.startPos = { x: 0, y: 0 };  // For reset on OOB

        // Hole
        this.hole = { x: 0, y: 0, radius: 18 };

        // Drag state
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragEnd = { x: 0, y: 0 };

        // Level system
        this.levelIndex = 0;
        this.strokes = 0;
        this.totalStrokes = 0;
        this.walls = [];
        this.obstacles = [];
        this.isTransitioning = false;
        this.ballSinking = false;
        this.sinkProgress = 0;

        // Define all levels in array
        this.levels = this.createLevels();

        this.loadLevel(this.levelIndex);

        // Bind handlers for proper removal
        this.onMouseDown = this.handleMouseDown.bind(this);
        this.onMouseMove = this.handleMouseMove.bind(this);
        this.onMouseUp = this.handleMouseUp.bind(this);
        this.onTouchStart = this.handleTouchStart.bind(this);
        this.onTouchMove = this.handleTouchMove.bind(this);
        this.onTouchEnd = this.handleTouchEnd.bind(this);

        // Canvas events for starting drag
        this.canvas.addEventListener('mousedown', this.onMouseDown);
        this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    }

    handleMouseDown(e) {
        if (this.startDrag(e)) {
            // Attach move/up to window so we can drag outside canvas
            window.addEventListener('mousemove', this.onMouseMove);
            window.addEventListener('mouseup', this.onMouseUp);
        }
    }

    handleMouseMove(e) {
        this.updateDrag(e);
    }

    handleMouseUp(e) {
        this.endDrag(e);
        // Clean up window listeners
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mouseup', this.onMouseUp);
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (this.startDrag(e.touches[0])) {
            window.addEventListener('touchmove', this.onTouchMove, { passive: false });
            window.addEventListener('touchend', this.onTouchEnd, { passive: false });
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        this.updateDrag(e.touches[0]);
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.endDrag(e.changedTouches[0]);
        window.removeEventListener('touchmove', this.onTouchMove);
        window.removeEventListener('touchend', this.onTouchEnd);
    }

    createLevels() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        return [
            // Level 1: Straight shot
            {
                name: "WARM UP",
                start: { x: 80, y: h / 2 },
                hole: { x: w - 80, y: h / 2 },
                walls: [],
                obstacles: []
            },
            // Level 2: Center wall
            {
                name: "THE WALL",
                start: { x: 80, y: h / 2 },
                hole: { x: w - 80, y: h / 2 },
                walls: [
                    { x: w / 2 - 10, y: h / 2 - 100, width: 20, height: 200 }
                ],
                obstacles: []
            },
            // Level 3: Corridor
            {
                name: "CORRIDOR",
                start: { x: 60, y: 60 },
                hole: { x: w - 60, y: h - 60 },
                walls: [
                    { x: 120, y: 0, width: 15, height: 300 },
                    { x: 220, y: 150, width: 15, height: 300 },
                    { x: 320, y: 0, width: 15, height: 300 }
                ],
                obstacles: []
            },
            // Level 4: Moving hazard
            {
                name: "DODGEBALL",
                start: { x: 80, y: h / 2 },
                hole: { x: w - 80, y: h / 2 },
                walls: [],
                obstacles: [
                    { type: 'moving', x: w / 2 - 20, y: 80, width: 40, height: 40, vy: 120, minY: 50, maxY: h - 90 }
                ]
            },
            // Level 5: Final challenge
            {
                name: "GAUNTLET",
                start: { x: 60, y: h / 2 },
                hole: { x: w - 60, y: h / 2 },
                walls: [
                    { x: 140, y: h / 2 - 120, width: 15, height: 100 },
                    { x: 140, y: h / 2 + 20, width: 15, height: 100 },
                    { x: 280, y: h / 2 - 80, width: 15, height: 160 }
                ],
                obstacles: [
                    { type: 'moving', x: w / 2 + 60, y: 60, width: 30, height: 30, vy: 140, minY: 40, maxY: h - 70 }
                ]
            }
        ];
    }

    stop() {
        super.stop();
        // Remove canvas listeners
        this.canvas.removeEventListener('mousedown', this.onMouseDown);
        this.canvas.removeEventListener('touchstart', this.onTouchStart);
        // Remove any lingering window listeners
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('touchmove', this.onTouchMove);
        window.removeEventListener('touchend', this.onTouchEnd);
    }

    getCanvasPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    isBallMoving() {
        return Math.hypot(this.ball.vx, this.ball.vy) >= this.minVelocity;
    }

    isBallStopped() {
        return !this.isBallMoving();
    }

    startDrag(e) {
        // Only allow drag when ball is stopped and not transitioning
        if (this.isBallMoving() || this.isTransitioning || this.ballSinking) return false;

        const pos = this.getCanvasPos(e);
        const dist = Math.hypot(pos.x - this.ball.x, pos.y - this.ball.y);

        // Can click anywhere near ball (within 60px)
        if (dist < 60) {
            this.isDragging = true;
            this.dragStart = { x: this.ball.x, y: this.ball.y };
            this.dragEnd = pos;
            return true;
        }
        return false;
    }

    updateDrag(e) {
        if (!this.isDragging) return;
        this.dragEnd = this.getCanvasPos(e);
    }

    endDrag(e) {
        if (!this.isDragging) return;
        this.isDragging = false;

        const dx = this.dragStart.x - this.dragEnd.x;
        const dy = this.dragStart.y - this.dragEnd.y;
        const dragDistance = Math.hypot(dx, dy);

        // Apply power multiplier (3x sensitivity) and clamp to max
        const power = Math.min(dragDistance * this.powerMultiplier, this.maxPower);

        // Minimum power threshold to shoot
        if (power > 30) {
            const angle = Math.atan2(dy, dx);
            this.ball.vx = Math.cos(angle) * power;
            this.ball.vy = Math.sin(angle) * power;
            this.strokes++;
            this.totalStrokes++;
            window.Audio?.play('hit');
        }
    }

    loadLevel(index) {
        if (index >= this.levels.length) {
            // Game complete!
            this.gameOver(`🏆 ALL LEVELS COMPLETE!\nTotal Strokes: ${this.totalStrokes}`);
            return;
        }

        const level = this.levels[index];
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Reset state
        this.strokes = 0;
        this.isTransitioning = false;
        this.ballSinking = false;
        this.sinkProgress = 0;

        // Set ball position
        this.ball = {
            x: level.start.x,
            y: level.start.y,
            vx: 0,
            vy: 0,
            radius: 10
        };
        this.startPos = { x: level.start.x, y: level.start.y };

        // Set hole
        this.hole = { x: level.hole.x, y: level.hole.y, radius: 18 };

        // Outer boundary walls
        this.walls = [
            { x: 0, y: 0, width: w, height: 12 },       // Top
            { x: 0, y: h - 12, width: w, height: 12 },  // Bottom
            { x: 0, y: 0, width: 12, height: h },       // Left
            { x: w - 12, y: 0, width: 12, height: h }   // Right
        ];

        // Add level-specific walls
        level.walls.forEach(wall => {
            this.walls.push({ ...wall });
        });

        // Copy obstacles (deep copy for moving objects)
        this.obstacles = level.obstacles.map(o => ({ ...o }));
    }

    resetBall() {
        // Reset ball to start position (on out of bounds)
        this.ball.x = this.startPos.x;
        this.ball.y = this.startPos.y;
        this.ball.vx = 0;
        this.ball.vy = 0;
        window.Audio?.play('hit');
    }

    update(dt) {
        this.particles.update(dt);

        // Update moving obstacles
        this.obstacles.forEach(o => {
            if (o.type === 'moving') {
                o.y += o.vy * dt;
                if (o.y <= o.minY) {
                    o.y = o.minY;
                    o.vy = Math.abs(o.vy);
                }
                if (o.y + o.height >= o.maxY) {
                    o.y = o.maxY - o.height;
                    o.vy = -Math.abs(o.vy);
                }
            }
        });

        // Ball sinking animation
        if (this.ballSinking) {
            this.sinkProgress += dt * 3;
            if (this.sinkProgress >= 1) {
                this.ballSinking = false;
                this.isTransitioning = true;
                setTimeout(() => {
                    this.levelIndex++;
                    this.loadLevel(this.levelIndex);
                }, 500);
            }
            return;
        }

        if (this.isTransitioning) return;

        // Apply friction
        this.ball.vx *= this.friction;
        this.ball.vy *= this.friction;

        // Stop ball if very slow
        const speed = Math.hypot(this.ball.vx, this.ball.vy);
        if (speed < this.minVelocity && speed > 0) {
            this.ball.vx = 0;
            this.ball.vy = 0;
        }

        // Move ball
        if (this.isBallMoving()) {
            this.ball.x += this.ball.vx * dt;
            this.ball.y += this.ball.vy * dt;
        }

        // Wall collisions
        [...this.walls, ...this.obstacles].forEach(wall => {
            this.handleWallCollision(wall);
        });

        // Out of bounds check
        const margin = 50;
        if (this.ball.x < -margin || this.ball.x > this.canvas.width + margin ||
            this.ball.y < -margin || this.ball.y > this.canvas.height + margin) {
            this.resetBall();
            return;
        }

        // Hole detection
        const distToHole = Math.hypot(this.ball.x - this.hole.x, this.ball.y - this.hole.y);
        const ballSpeed = Math.hypot(this.ball.vx, this.ball.vy);

        // Ball vacuum effect when close to hole
        if (distToHole < this.hole.radius * 1.5 && ballSpeed < this.maxHoleSpeed) {
            // Gentle pull toward hole
            const pullStrength = 0.1;
            this.ball.vx += (this.hole.x - this.ball.x) * pullStrength;
            this.ball.vy += (this.hole.y - this.ball.y) * pullStrength;
        }

        // Ball enters hole
        if (distToHole < this.hole.radius - 5 && ballSpeed < this.maxHoleSpeed) {
            // Start sinking animation
            this.ballSinking = true;
            this.sinkProgress = 0;
            this.ball.vx = 0;
            this.ball.vy = 0;

            // Score
            const parStrokes = 3;
            const bonus = Math.max(0, (parStrokes - this.strokes + 1) * 25);
            this.updateScore(100 + bonus);

            this.particles.explode(this.hole.x, this.hole.y, '#0f0', 25, 150);
            window.Audio?.play('win');
        }
    }

    handleWallCollision(wall) {
        const ball = this.ball;

        // Find closest point on wall rectangle to ball center
        const closestX = Math.max(wall.x, Math.min(ball.x, wall.x + wall.width));
        const closestY = Math.max(wall.y, Math.min(ball.y, wall.y + wall.height));

        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        const distance = Math.hypot(distX, distY);

        if (distance < ball.radius) {
            // Collision detected

            if (distance > 0) {
                // Calculate overlap and push out
                const overlap = ball.radius - distance + 1;
                const normalX = distX / distance;
                const normalY = distY / distance;

                // Push ball out of wall
                ball.x += normalX * overlap;
                ball.y += normalY * overlap;

                // Reflect velocity
                const dotProduct = ball.vx * normalX + ball.vy * normalY;
                ball.vx -= 2 * dotProduct * normalX;
                ball.vy -= 2 * dotProduct * normalY;

                // Apply bounce energy loss
                ball.vx *= this.bounceEnergy;
                ball.vy *= this.bounceEnergy;

            } else {
                // Ball center inside wall - emergency push out
                // Determine which edge is closest
                const toLeft = ball.x - wall.x;
                const toRight = (wall.x + wall.width) - ball.x;
                const toTop = ball.y - wall.y;
                const toBottom = (wall.y + wall.height) - ball.y;

                const minDist = Math.min(toLeft, toRight, toTop, toBottom);

                if (minDist === toLeft) {
                    ball.x = wall.x - ball.radius - 1;
                    ball.vx = -Math.abs(ball.vx) * this.bounceEnergy;
                } else if (minDist === toRight) {
                    ball.x = wall.x + wall.width + ball.radius + 1;
                    ball.vx = Math.abs(ball.vx) * this.bounceEnergy;
                } else if (minDist === toTop) {
                    ball.y = wall.y - ball.radius - 1;
                    ball.vy = -Math.abs(ball.vy) * this.bounceEnergy;
                } else {
                    ball.y = wall.y + wall.height + ball.radius + 1;
                    ball.vy = Math.abs(ball.vy) * this.bounceEnergy;
                }
            }

            this.particles.emit(ball.x, ball.y, '#0ff', 5);
            window.Audio?.play('click');
        }
    }

    draw() {
        const ctx = this.ctx;

        // Background
        ctx.fillStyle = '#050f05';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid pattern
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < this.canvas.width; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }

        ctx.save();
        this.applyShake(ctx);

        // Draw hole (behind ball)
        this.drawHole(ctx);

        // Draw walls
        ctx.fillStyle = '#0ff';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#0ff';
        this.walls.forEach(w => {
            ctx.fillRect(w.x, w.y, w.width, w.height);
        });

        // Draw obstacles
        ctx.fillStyle = '#f0f';
        ctx.shadowColor = '#f0f';
        this.obstacles.forEach(o => {
            ctx.fillRect(o.x, o.y, o.width, o.height);
        });
        ctx.shadowBlur = 0;

        // Draw aiming line
        if (this.isDragging && this.isBallStopped()) {
            this.drawAimLine(ctx);
        }

        // Draw ball (with sinking animation)
        this.drawBall(ctx);

        // Particles
        this.particles.draw(ctx);

        ctx.restore();

        // UI
        this.drawUI(ctx);
    }

    drawHole(ctx) {
        // Outer glow
        ctx.beginPath();
        ctx.arc(this.hole.x, this.hole.y, this.hole.radius + 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.fill();

        // Hole
        ctx.beginPath();
        ctx.arc(this.hole.x, this.hole.y, this.hole.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();

        // Rim
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#0f0';
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawBall(ctx) {
        let radius = this.ball.radius;
        let alpha = 1;

        // Sinking animation
        if (this.ballSinking) {
            radius = this.ball.radius * (1 - this.sinkProgress);
            alpha = 1 - this.sinkProgress * 0.5;

            // Move ball toward hole center
            const t = this.sinkProgress;
            const drawX = this.ball.x + (this.hole.x - this.ball.x) * t;
            const drawY = this.ball.y + (this.hole.y - this.ball.y) * t;

            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 15 * (1 - this.sinkProgress);
            ctx.shadowColor = '#fff';
            ctx.beginPath();
            ctx.arc(drawX, drawY, Math.max(1, radius), 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
            return;
        }

        // Normal ball
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#fff';
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Ball highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(this.ball.x - 3, this.ball.y - 3, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
    }

    drawAimLine(ctx) {
        const dx = this.dragStart.x - this.dragEnd.x;
        const dy = this.dragStart.y - this.dragEnd.y;
        const dragDistance = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        // Draw range circle (max drag distance indicator)
        if (this.isBallStopped() && !this.ballSinking && !this.isTransitioning) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.ball.x, this.ball.y, this.maxDragDistance, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Calculate power (clamped)
        const power = Math.min(dragDistance * this.powerMultiplier, this.maxPower);
        const powerRatio = power / this.maxPower;

        if (power < 30) return;

        // Power-based color: green -> yellow -> red
        const hue = 120 - powerRatio * 120;
        ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.lineWidth = 3;

        // Clamp visual line length to maxDragDistance
        const visualDistance = Math.min(dragDistance, this.maxDragDistance);
        const lineLength = visualDistance * 1.2;

        // Draw dotted trajectory line
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(this.ball.x, this.ball.y);
        ctx.lineTo(
            this.ball.x + Math.cos(angle) * lineLength,
            this.ball.y + Math.sin(angle) * lineLength
        );
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrow head
        const arrowSize = 12;
        const arrowAngle = 0.5;
        const endX = this.ball.x + Math.cos(angle) * lineLength;
        const endY = this.ball.y + Math.sin(angle) * lineLength;

        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - Math.cos(angle - arrowAngle) * arrowSize,
            endY - Math.sin(angle - arrowAngle) * arrowSize
        );
        ctx.lineTo(
            endX - Math.cos(angle + arrowAngle) * arrowSize,
            endY - Math.sin(angle + arrowAngle) * arrowSize
        );
        ctx.closePath();
        ctx.fill();

        // Power meter bar
        const barWidth = 80;
        const barHeight = 10;
        const barX = this.ball.x - barWidth / 2;
        const barY = this.ball.y + 30;

        ctx.fillStyle = '#111';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.fillRect(barX, barY, barWidth * powerRatio, barHeight);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // "MAX" indicator when at full power
        if (powerRatio >= 0.98) {
            ctx.fillStyle = '#ff0';
            ctx.font = 'bold 10px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText('MAX', this.ball.x, barY + barHeight + 14);
        }
    }

    drawUI(ctx) {
        const level = this.levels[this.levelIndex];

        // Level info
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Orbitron';
        ctx.textAlign = 'left';
        ctx.fillText(`LEVEL ${this.levelIndex + 1}/${this.levels.length}`, 20, 28);

        ctx.fillStyle = '#0f0';
        ctx.font = '11px Orbitron';
        ctx.fillText(level?.name || '', 20, 44);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Orbitron';
        ctx.fillText(`STROKES: ${this.strokes}`, 20, 62);
        ctx.fillStyle = '#888';
        ctx.fillText(`TOTAL: ${this.totalStrokes}`, 20, 78);

        // Instructions
        if (this.isBallStopped() && !this.ballSinking && !this.isTransitioning) {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '11px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText('DRAG FROM BALL TO SHOOT', this.canvas.width / 2, this.canvas.height - 18);
        }

        // Level complete message
        if (this.ballSinking) {
            ctx.fillStyle = '#0f0';
            ctx.font = 'bold 24px Orbitron';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#0f0';
            ctx.fillText('HOLE IN!', this.canvas.width / 2, this.canvas.height / 2);
            ctx.shadowBlur = 0;
        }
    }
}
