/**
 * Data Slicer (Fruit Ninja style)
 * Features: Mouse trail, slicing physics, virus bombs, binary particles
 */
import { Game } from './Game.js';

export class SlicerGame extends Game {
    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 450;
        this.canvas.height = 400;
        this.canvas.className = "border-2 border-blue-500 shadow-[0_0_20px_blue] bg-black max-w-full cursor-none";
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.cubes = [];
        this.slicedPieces = [];
        this.particles = [];
        this.mouseTrail = [];
        this.mouse = { x: 0, y: 0, prevX: 0, prevY: 0, down: false };
        this.spawnTimer = 0;
        this.spawnInterval = 1.2;
        this.missed = 0;
        this.maxMissed = 3;

        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        this.mouseDownHandler = () => this.mouse.down = true;
        this.mouseUpHandler = () => this.mouse.down = false;

        this.canvas.addEventListener('mousemove', this.mouseMoveHandler);
        this.canvas.addEventListener('mousedown', this.mouseDownHandler);
        this.canvas.addEventListener('mouseup', this.mouseUpHandler);

        // Mobile touch support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.mouse.down = true;
            this.handleTouch(e);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouch(e);
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => {
            this.mouse.down = false;
        });
    }

    handleTouch(e) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.prevX = this.mouse.x;
        this.mouse.prevY = this.mouse.y;
        this.mouse.x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
        this.mouse.y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);

        this.mouseTrail.push({
            x: this.mouse.x,
            y: this.mouse.y,
            life: 1
        });
        if (this.mouseTrail.length > 20) this.mouseTrail.shift();
    }

    stop() {
        super.stop();
        this.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
        this.canvas.removeEventListener('mousedown', this.mouseDownHandler);
        this.canvas.removeEventListener('mouseup', this.mouseUpHandler);
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.prevX = this.mouse.x;
        this.mouse.prevY = this.mouse.y;
        this.mouse.x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        this.mouse.y = (e.clientY - rect.top) * (this.canvas.height / rect.height);

        this.mouseTrail.push({
            x: this.mouse.x,
            y: this.mouse.y,
            life: 1
        });
        if (this.mouseTrail.length > 20) this.mouseTrail.shift();
    }

    spawnCube() {
        const isVirus = Math.random() < 0.15;
        const x = 50 + Math.random() * (this.canvas.width - 100);
        this.cubes.push({
            x: x,
            y: this.canvas.height + 30,
            vx: (Math.random() - 0.5) * 100,
            vy: -400 - Math.random() * 150,
            size: 35 + Math.random() * 15,
            rotation: 0,
            rotSpeed: (Math.random() - 0.5) * 5,
            isVirus: isVirus,
            color: isVirus ? '#f00' : this.randomColor()
        });
    }

    randomColor() {
        const colors = ['#0ff', '#0f0', '#ff0', '#f0f', '#00f', '#0af'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    sliceCube(cube) {
        if (cube.isVirus) {
            this.gameOver('VIRUS DETECTED!');
            return;
        }

        window.Audio?.play('hit');
        this.updateScore(10);

        // Create two halves
        for (let i = 0; i < 2; i++) {
            this.slicedPieces.push({
                x: cube.x,
                y: cube.y,
                vx: i === 0 ? -80 : 80,
                vy: cube.vy * 0.5,
                size: cube.size * 0.7,
                rotation: cube.rotation,
                rotSpeed: cube.rotSpeed * 2,
                color: cube.color,
                half: i,
                life: 1
            });
        }

        // Binary particles
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: cube.x,
                y: cube.y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                char: Math.random() < 0.5 ? '0' : '1',
                life: 1,
                color: cube.color
            });
        }
    }

    update(dt) {
        // Spawn cubes
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnInterval = Math.max(0.5, 1.2 - this.score / 300);
            this.spawnCube();
        }

        // Update mouse trail
        this.mouseTrail.forEach(p => p.life -= dt * 3);
        this.mouseTrail = this.mouseTrail.filter(p => p.life > 0);

        // Update cubes
        this.cubes.forEach(cube => {
            cube.x += cube.vx * dt;
            cube.y += cube.vy * dt;
            cube.vy += 500 * dt; // Gravity
            cube.rotation += cube.rotSpeed * dt;
        });

        // Check slicing
        const speed = Math.hypot(this.mouse.x - this.mouse.prevX, this.mouse.y - this.mouse.prevY);
        if (speed > 5) {
            this.cubes.forEach((cube, i) => {
                const dx = this.mouse.x - cube.x;
                const dy = this.mouse.y - cube.y;
                if (Math.hypot(dx, dy) < cube.size) {
                    this.sliceCube(cube);
                    this.cubes.splice(i, 1);
                }
            });
        }

        // Remove fallen cubes
        this.cubes = this.cubes.filter(cube => {
            if (cube.y > this.canvas.height + 50 && !cube.isVirus) {
                this.missed++;
                if (this.missed >= this.maxMissed) {
                    this.gameOver('TOO MANY MISSED!');
                }
                return false;
            }
            return cube.y < this.canvas.height + 100;
        });

        // Update sliced pieces
        this.slicedPieces.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 600 * dt;
            p.rotation += p.rotSpeed * dt;
            p.life -= dt * 0.8;
        });
        this.slicedPieces = this.slicedPieces.filter(p => p.life > 0);

        // Update particles
        this.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 200 * dt;
            p.life -= dt * 2;
        });
        this.particles = this.particles.filter(p => p.life > 0);
    }

    draw() {
        const ctx = this.ctx;

        // Background
        ctx.fillStyle = '#0a0a15';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid pattern
        ctx.strokeStyle = 'rgba(0, 100, 255, 0.1)';
        for (let i = 0; i < this.canvas.width; i += 30) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, this.canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i < this.canvas.height; i += 30) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(this.canvas.width, i);
            ctx.stroke();
        }

        // Mouse trail (laser)
        if (this.mouseTrail.length > 1) {
            ctx.strokeStyle = '#0ff';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#0ff';
            ctx.beginPath();
            this.mouseTrail.forEach((p, i) => {
                ctx.globalAlpha = p.life;
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            ctx.lineWidth = 1;
        }

        // Cubes
        this.cubes.forEach(cube => {
            ctx.save();
            ctx.translate(cube.x, cube.y);
            ctx.rotate(cube.rotation);
            ctx.fillStyle = cube.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = cube.color;
            ctx.fillRect(-cube.size / 2, -cube.size / 2, cube.size, cube.size);
            if (cube.isVirus) {
                ctx.fillStyle = '#000';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('☠', 0, 6);
            }
            ctx.restore();
        });
        ctx.shadowBlur = 0;

        // Sliced pieces
        this.slicedPieces.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            if (p.half === 0) {
                ctx.moveTo(-p.size / 2, -p.size / 2);
                ctx.lineTo(p.size / 2, -p.size / 2);
                ctx.lineTo(-p.size / 2, p.size / 2);
            } else {
                ctx.moveTo(p.size / 2, -p.size / 2);
                ctx.lineTo(p.size / 2, p.size / 2);
                ctx.lineTo(-p.size / 2, p.size / 2);
            }
            ctx.fill();
            ctx.restore();
        });
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        // Binary particles
        ctx.font = 'bold 14px monospace';
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;
            ctx.fillText(p.char, p.x, p.y);
        });
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // Cursor
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.mouse.x, this.mouse.y, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.mouse.x - 20, this.mouse.y);
        ctx.lineTo(this.mouse.x + 20, this.mouse.y);
        ctx.moveTo(this.mouse.x, this.mouse.y - 20);
        ctx.lineTo(this.mouse.x, this.mouse.y + 20);
        ctx.stroke();

        // UI
        ctx.fillStyle = '#fff';
        ctx.font = '14px Orbitron';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${this.score}`, 10, 25);

        // Missed indicator
        ctx.fillStyle = '#f44';
        ctx.fillText(`MISSED: ${this.missed}/${this.maxMissed}`, this.canvas.width - 120, 25);
    }
}
