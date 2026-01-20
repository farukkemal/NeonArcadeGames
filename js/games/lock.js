/**
 * Hack the Lock (Timing/Reflex Lock Picker)
 * Features: Rotating dial, target zones, speed increase, access denied animation
 */
import { Game } from './Game.js';

export class LockGame extends Game {
    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 350;
        this.canvas.height = 400;
        this.canvas.className = "border-2 border-green-500 shadow-[0_0_20px_#0f0] bg-black max-w-full";
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.level = 1;
        this.locksPerLevel = 10;
        this.currentLock = 0;
        this.setupLock();

        this.flashTimer = 0;
        this.flashColor = null;
        this.message = '';
        this.messageTimer = 0;

        this.keyHandler = (e) => this.handleKey(e);
        window.addEventListener('keydown', this.keyHandler);
    }

    stop() {
        super.stop();
        window.removeEventListener('keydown', this.keyHandler);
    }

    setupLock() {
        this.angle = 0;
        this.direction = 1;
        this.baseSpeed = 2 + this.level * 0.5;
        this.speed = this.baseSpeed;
        this.targetAngle = Math.random() * Math.PI * 2;
        this.targetSize = Math.max(0.3, 0.6 - this.currentLock * 0.03);
        this.locked = false;
    }

    handleKey(e) {
        if (!this.isRunning || this.locked) return;

        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this.attemptUnlock();
        }
    }

    attemptUnlock() {
        const diff = Math.abs(this.normalizeAngle(this.angle - this.targetAngle));

        if (diff < this.targetSize) {
            // Success!
            this.locked = true;
            this.flashColor = '#0f0';
            this.flashTimer = 0.3;
            window.Audio?.play('win');

            const bonus = Math.floor((1 - diff / this.targetSize) * 50);
            this.updateScore(20 + bonus);

            this.currentLock++;

            if (this.currentLock >= this.locksPerLevel) {
                this.message = `LEVEL ${this.level} COMPLETE!`;
                this.messageTimer = 1.5;
                this.level++;
                this.currentLock = 0;
            }

            setTimeout(() => {
                this.direction *= -1;
                this.speed = this.baseSpeed + this.currentLock * 0.3;
                this.setupLock();
                this.locked = false;
            }, 400);

        } else {
            // Fail
            this.flashColor = '#f00';
            this.flashTimer = 0.5;
            this.message = 'ACCESS DENIED';
            this.messageTimer = 0.8;
            window.Audio?.play('gameover');
            this.gameOver('SECURITY BREACH!');
        }
    }

    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return Math.abs(angle);
    }

    update(dt) {
        if (!this.locked) {
            this.angle += this.speed * this.direction * dt;
            if (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;
            if (this.angle < 0) this.angle += Math.PI * 2;
        }

        if (this.flashTimer > 0) this.flashTimer -= dt;
        if (this.messageTimer > 0) this.messageTimer -= dt;
    }

    draw() {
        const ctx = this.ctx;
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2 - 20;
        const radius = 120;

        // Background
        if (this.flashTimer > 0 && this.flashColor) {
            ctx.fillStyle = this.flashColor === '#f00' ?
                `rgba(255, 0, 0, ${this.flashTimer})` :
                `rgba(0, 255, 0, ${this.flashTimer * 0.5})`;
        } else {
            ctx.fillStyle = '#050510';
        }
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Outer rings
        for (let i = 0; i < 4; i++) {
            const r = radius + 20 + i * 8;
            ctx.strokeStyle = `rgba(0, 255, 0, ${0.1 + i * 0.05})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Main lock ring
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 8;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#0f0';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Target zone
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, this.targetAngle - this.targetSize, this.targetAngle + this.targetSize);
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, this.targetAngle - this.targetSize, this.targetAngle + this.targetSize);
        ctx.stroke();

        // Dial/needle
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fff';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(
            cx + Math.cos(this.angle) * (radius - 10),
            cy + Math.sin(this.angle) * (radius - 10)
        );
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Center dot
        ctx.fillStyle = '#0f0';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#0f0';
        ctx.beginPath();
        ctx.arc(cx, cy, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner text
        ctx.fillStyle = '#0f0';
        ctx.font = 'bold 12px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('PRESS SPACE', cx, cy + 5);

        // Progress bar
        const barWidth = 200;
        const barX = (this.canvas.width - barWidth) / 2;
        const barY = this.canvas.height - 80;

        ctx.fillStyle = '#222';
        ctx.fillRect(barX, barY, barWidth, 20);

        ctx.fillStyle = '#0f0';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#0f0';
        ctx.fillRect(barX, barY, barWidth * (this.currentLock / this.locksPerLevel), 20);
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#0f0';
        ctx.strokeRect(barX, barY, barWidth, 20);

        // UI Text
        ctx.fillStyle = '#fff';
        ctx.font = '14px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(`LEVEL ${this.level}`, cx, 35);
        ctx.fillText(`LOCKS: ${this.currentLock}/${this.locksPerLevel}`, cx, barY + 45);

        // Message
        if (this.messageTimer > 0) {
            ctx.fillStyle = this.message.includes('DENIED') ? '#f00' : '#0f0';
            ctx.font = 'bold 20px Orbitron';
            ctx.shadowBlur = 20;
            ctx.shadowColor = ctx.fillStyle;
            ctx.fillText(this.message, cx, cy - 60);
            ctx.shadowBlur = 0;
        }

        // Direction indicator
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.fillText(this.direction > 0 ? '→ CW' : '← CCW', cx, this.canvas.height - 25);
    }
}
