/**
 * Neon Stack (Block Stacking Tower)
 * Features: Sliding blocks, precision cutting, color cycling, elevator effect
 */
import { Game, ParticleSystem } from './Game.js';

export class StackGame extends Game {
    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 400;
        this.canvas.height = 500;
        this.canvas.className = "border-2 border-pink-500 shadow-[0_0_20px_#ff00ff] bg-black max-w-full";
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.particles = new ParticleSystem();

        // Stack configuration
        this.baseWidth = 120;
        this.blockHeight = 25;
        this.baseY = this.canvas.height - 80;

        // Game state
        this.stack = [];
        this.fallingPieces = [];
        this.cameraY = 0;
        this.colorIndex = 0;

        // Current moving block
        this.currentBlock = null;
        this.direction = 1;
        this.speed = 150;

        // Initialize first block (base)
        this.stack.push({
            x: (this.canvas.width - this.baseWidth) / 2,
            y: this.baseY,
            width: this.baseWidth,
            color: this.getColor(0)
        });

        // Spawn first moving block
        this.spawnBlock();

        // Input handlers
        this.handleInput = (e) => {
            e.preventDefault();
            if (this.currentBlock && this.isRunning) {
                this.placeBlock();
            }
        };

        this.canvas.addEventListener('mousedown', this.handleInput);
        this.canvas.addEventListener('touchstart', this.handleInput, { passive: false });

        this.keyHandler = (e) => {
            if (e.key === ' ' && this.currentBlock && this.isRunning) {
                e.preventDefault();
                this.placeBlock();
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

    getColor(index) {
        const hue = (index * 25) % 360;
        return `hsl(${hue}, 100%, 60%)`;
    }

    spawnBlock() {
        const lastBlock = this.stack[this.stack.length - 1];
        this.colorIndex++;

        this.currentBlock = {
            x: this.direction > 0 ? -lastBlock.width : this.canvas.width,
            y: lastBlock.y - this.blockHeight,
            width: lastBlock.width,
            color: this.getColor(this.colorIndex)
        };

        // Increase speed every 5 blocks
        this.speed = 150 + Math.floor(this.stack.length / 5) * 20;
    }

    placeBlock() {
        const lastBlock = this.stack[this.stack.length - 1];
        const current = this.currentBlock;

        // Calculate overlap
        const overlapStart = Math.max(current.x, lastBlock.x);
        const overlapEnd = Math.min(current.x + current.width, lastBlock.x + lastBlock.width);
        const overlapWidth = overlapEnd - overlapStart;

        if (overlapWidth <= 0) {
            // Missed completely - game over
            this.fallingPieces.push({
                x: current.x,
                y: current.y,
                width: current.width,
                color: current.color,
                vy: 0
            });
            this.shake(10, 0.3);
            window.Audio?.play('gameover');
            this.currentBlock = null;
            setTimeout(() => this.gameOver(), 500);
            return;
        }

        // Perfect or partial match
        const perfectThreshold = 5;
        const isPerfect = Math.abs(overlapWidth - current.width) < perfectThreshold;

        if (isPerfect) {
            // Perfect placement
            this.particles.explode(
                lastBlock.x + lastBlock.width / 2,
                current.y,
                '#fff', 30, 200
            );
            window.Audio?.play('win');
            this.updateScore(20);

            // Keep same width
            this.stack.push({
                x: lastBlock.x,
                y: current.y,
                width: lastBlock.width,
                color: current.color
            });
        } else {
            // Partial match - cut off excess
            window.Audio?.play('hit');
            this.updateScore(10);

            // Add the matching part
            this.stack.push({
                x: overlapStart,
                y: current.y,
                width: overlapWidth,
                color: current.color
            });

            // Create falling piece for the cut part
            if (current.x < lastBlock.x) {
                // Cut from left
                this.fallingPieces.push({
                    x: current.x,
                    y: current.y,
                    width: lastBlock.x - current.x,
                    color: current.color,
                    vy: 0
                });
            } else {
                // Cut from right
                this.fallingPieces.push({
                    x: overlapEnd,
                    y: current.y,
                    width: (current.x + current.width) - overlapEnd,
                    color: current.color,
                    vy: 0
                });
            }

            this.particles.emit(overlapStart, current.y, current.color, 10);
        }

        this.direction *= -1;
        this.spawnBlock();
    }

    update(dt) {
        this.particles.update(dt);

        // Move current block
        if (this.currentBlock) {
            this.currentBlock.x += this.speed * this.direction * dt;

            // Bounce at edges
            if (this.currentBlock.x <= -this.currentBlock.width - 50) {
                this.direction = 1;
            }
            if (this.currentBlock.x >= this.canvas.width + 50) {
                this.direction = -1;
            }
        }

        // Update falling pieces
        this.fallingPieces.forEach(p => {
            p.vy += 800 * dt;
            p.y += p.vy * dt;
        });
        this.fallingPieces = this.fallingPieces.filter(p => p.y < this.canvas.height + 100);

        // Camera follows tower (elevator effect)
        const topBlock = this.stack[this.stack.length - 1];
        const targetCameraY = Math.max(0, (this.baseY - topBlock.y) - 200);
        this.cameraY += (targetCameraY - this.cameraY) * 2 * dt;
    }

    draw() {
        const ctx = this.ctx;

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0a001a');
        gradient.addColorStop(0.5, '#1a0033');
        gradient.addColorStop(1, '#0d001a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.save();
        ctx.translate(0, this.cameraY);
        this.applyShake(ctx);

        // Draw stacked blocks
        this.stack.forEach((block, i) => {
            ctx.fillStyle = block.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = block.color;
            ctx.fillRect(block.x, block.y, block.width, this.blockHeight - 2);

            // Block highlight
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(block.x, block.y, block.width, 3);
        });

        // Draw current moving block
        if (this.currentBlock) {
            ctx.fillStyle = this.currentBlock.color;
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.currentBlock.color;
            ctx.fillRect(
                this.currentBlock.x,
                this.currentBlock.y,
                this.currentBlock.width,
                this.blockHeight - 2
            );
        }

        // Draw falling pieces
        this.fallingPieces.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.7;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.fillRect(p.x, p.y, p.width, this.blockHeight - 2);
            ctx.globalAlpha = 1;
        });

        ctx.shadowBlur = 0;

        // Draw particles
        this.particles.draw(ctx);

        ctx.restore();

        // UI
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Orbitron';
        ctx.textAlign = 'left';
        ctx.fillText(`HEIGHT: ${this.stack.length - 1}`, 15, 30);
        ctx.fillText(`SCORE: ${this.score}`, 15, 55);

        // Instructions
        if (this.stack.length <= 2) {
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '14px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText('TAP TO STACK!', this.canvas.width / 2, this.canvas.height - 30);
        }
    }
}
