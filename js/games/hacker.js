/**
 * Matrix Hacker (Falling Words Typing Game)
 * Features: Cyber security terms, level system, combo multiplier, Matrix rain
 */
import { Game } from './Game.js';

export class HackerGame extends Game {
    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 400;
        this.canvas.height = 500;
        this.canvas.className = "border-2 border-green-500 shadow-[0_0_20px_#0f0] bg-black max-w-full";
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.words = [
            'FIREWALL', 'PROXY', 'BREACH', 'NODE', 'ENCRYPT', 'DECRYPT',
            'MALWARE', 'TROJAN', 'PHISHING', 'EXPLOIT', 'ROOTKIT', 'BOTNET',
            'PAYLOAD', 'KEYLOG', 'SPYWARE', 'DDOS', 'PATCH', 'BUFFER',
            'OVERFLOW', 'HASH', 'TOKEN', 'AUTH', 'CIPHER', 'VIRUS',
            'WORM', 'SHELL', 'SUDO', 'ROOT', 'ADMIN', 'KERNEL',
            'DAEMON', 'SOCKET', 'PORT', 'PACKET', 'PROTOCOL', 'SSL',
            'VPN', 'TOR', 'ONION', 'DARK', 'DEEP', 'HACK', 'CRACK'
        ];

        this.fallingWords = [];
        this.typedText = '';
        this.level = 1;
        this.wordsCleared = 0;
        this.combo = 0;
        this.multiplier = 1;
        this.baseSpeed = 30;
        this.spawnTimer = 0;
        this.spawnInterval = 2.5;
        this.matrixRain = [];

        this.initMatrixRain();
        this.spawnWord();

        this.keyHandler = (e) => this.handleKey(e);
        window.addEventListener('keydown', this.keyHandler);
    }

    stop() {
        super.stop();
        window.removeEventListener('keydown', this.keyHandler);
    }

    initMatrixRain() {
        for (let i = 0; i < 30; i++) {
            this.matrixRain.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                speed: 50 + Math.random() * 100,
                chars: this.generateRainColumn()
            });
        }
    }

    generateRainColumn() {
        const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        const len = 5 + Math.floor(Math.random() * 10);
        let col = '';
        for (let i = 0; i < len; i++) {
            col += chars[Math.floor(Math.random() * chars.length)];
        }
        return col;
    }

    spawnWord() {
        const word = this.words[Math.floor(Math.random() * this.words.length)];
        this.fallingWords.push({
            text: word,
            x: 50 + Math.random() * (this.canvas.width - 150),
            y: -20,
            speed: this.baseSpeed + (this.level - 1) * 5,
            matched: 0
        });
    }

    handleKey(e) {
        if (!this.isRunning) return;

        if (e.key === 'Backspace') {
            this.typedText = this.typedText.slice(0, -1);
            return;
        }

        if (e.key.length === 1 && /[a-zA-ZğüşıöçĞÜŞİÖÇ]/i.test(e.key)) {
            this.typedText += e.key.toLocaleUpperCase('tr-TR');
            this.checkMatch();
        }
    }

    checkMatch() {
        let matched = false;

        for (let word of this.fallingWords) {
            if (word.text.startsWith(this.typedText)) {
                word.matched = this.typedText.length;
                if (this.typedText === word.text) {
                    // Word completed
                    this.combo++;
                    this.multiplier = Math.min(5, 1 + Math.floor(this.combo / 3));
                    this.updateScore(word.text.length * 10 * this.multiplier);
                    this.wordsCleared++;
                    word.completed = true;
                    this.typedText = '';
                    window.Audio?.play('win');

                    // Level up every 10 words
                    if (this.wordsCleared % 10 === 0) {
                        this.level++;
                        this.baseSpeed = Math.min(100, 30 + (this.level - 1) * 12);
                        this.spawnInterval = Math.max(0.7, 2.5 - this.level * 0.25);
                    }
                }
                matched = true;
                break;
            }
        }

        if (!matched && this.typedText.length > 0) {
            // Wrong key - reset combo
            this.combo = 0;
            this.multiplier = 1;
            window.Audio?.play('hit');
        }
    }

    update(dt) {
        // Update Matrix rain
        this.matrixRain.forEach(col => {
            col.y += col.speed * dt;
            if (col.y > this.canvas.height + 100) {
                col.y = -150;
                col.x = Math.random() * this.canvas.width;
                col.chars = this.generateRainColumn();
            }
        });

        // Spawn new words
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            if (this.fallingWords.filter(w => !w.completed).length < 5) {
                this.spawnWord();
            }
        }

        // Update falling words
        this.fallingWords.forEach(word => {
            if (!word.completed) {
                word.y += word.speed * dt;
            }
        });

        // Remove completed words with fade
        this.fallingWords = this.fallingWords.filter(w => {
            if (w.completed) return false;
            if (w.y > this.canvas.height - 30) {
                // Word missed
                this.combo = 0;
                this.multiplier = 1;
                window.Audio?.play('gameover');
                return false;
            }
            return true;
        });

        // Game over if too many words missed (handled by lives or just continue)
        // For now, keep playing indefinitely
    }

    draw() {
        const ctx = this.ctx;

        // Black background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Matrix rain background
        ctx.font = '12px monospace';
        this.matrixRain.forEach(col => {
            for (let i = 0; i < col.chars.length; i++) {
                const alpha = 0.1 + (i / col.chars.length) * 0.2;
                ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
                ctx.fillText(col.chars[i], col.x, col.y + i * 14);
            }
        });

        // Draw falling words
        ctx.font = 'bold 18px Orbitron';
        this.fallingWords.forEach(word => {
            if (word.completed) return;

            // Shadow/glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#0f0';

            // Draw matched portion in bright green
            const matched = word.text.slice(0, word.matched);
            const unmatched = word.text.slice(word.matched);

            ctx.fillStyle = '#0f0';
            ctx.fillText(matched, word.x, word.y);

            // Draw unmatched portion in dimmer green
            const matchedWidth = ctx.measureText(matched).width;
            ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.fillText(unmatched, word.x + matchedWidth, word.y);
        });
        ctx.shadowBlur = 0;

        // Draw input area
        ctx.fillStyle = '#111';
        ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
        ctx.strokeStyle = '#0f0';
        ctx.strokeRect(10, this.canvas.height - 40, this.canvas.width - 20, 30);

        ctx.fillStyle = '#0f0';
        ctx.font = 'bold 16px Orbitron';
        ctx.fillText('> ' + this.typedText + '_', 20, this.canvas.height - 18);

        // UI - Top bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.canvas.width, 35);

        ctx.fillStyle = '#0f0';
        ctx.font = '12px Orbitron';
        ctx.fillText(`LEVEL: ${this.level}`, 10, 22);
        ctx.fillText(`WORDS: ${this.wordsCleared}`, 100, 22);

        // Combo/Multiplier
        if (this.multiplier > 1) {
            ctx.fillStyle = '#ff0';
            ctx.fillText(`x${this.multiplier} COMBO: ${this.combo}`, 200, 22);
        }

        ctx.fillStyle = '#0ff';
        ctx.fillText(`SCORE: ${this.score}`, this.canvas.width - 100, 22);

        // Terminal prompt effect
        ctx.fillStyle = '#0f0';
        ctx.font = '10px monospace';
        ctx.fillText('[SYSTEM_HACK ACTIVE]', 10, this.canvas.height - 55);
    }
}
