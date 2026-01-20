/**
 * Game Base Class
 * All games extend this class for common functionality
 */
export class Game {
    constructor(container, scoreDisplay, onGameOver) {
        this.container = container;
        this.scoreDisplay = scoreDisplay;
        this.onGameOver = onGameOver;
        this.score = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.pauseOverlay = null;
        this.container.innerHTML = '';

        // Screen shake state
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;

        // Global ESC pause handler
        this.escHandler = (e) => {
            if (e.key === 'Escape' && this.isRunning) {
                if (this.isPaused) this.resume();
                else this.pause();
            }
        };
        window.addEventListener('keydown', this.escHandler);

        // Resize handler for canvas games
        this.resizeHandler = () => this.handleResize();
        window.addEventListener('resize', this.resizeHandler);
    }

    // Override in subclasses
    init() { }
    update(dt) { }
    draw() { }
    handleResize() { } // Override for canvas resize logic

    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        this.init();
        requestAnimationFrame(t => this.loop(t));
    }

    stop() {
        this.isRunning = false;
        window.removeEventListener('keydown', this.escHandler);
        window.removeEventListener('resize', this.resizeHandler);
    }

    pause() {
        if (!this.isRunning || this.isPaused) return;
        this.isPaused = true;
        window.Audio?.play('click');

        this.pauseOverlay = document.createElement('div');
        this.pauseOverlay.className = 'absolute inset-0 flex items-center justify-center flex-col bg-black/70 backdrop-blur-sm z-50';
        this.pauseOverlay.innerHTML = `
            <h2 class="text-4xl font-display text-neon-blue font-bold mb-6" style="text-shadow: 0 0 20px cyan;">⏸ DURAKLATILDI</h2>
            <button id="resumeBtn" class="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:scale-105 transition-transform shadow-lg mb-3">▶ DEVAM ET</button>
            <button id="exitBtn" class="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-lg hover:scale-105 transition-transform shadow-lg">✖ ÇIKIŞ</button>
            <p class="text-gray-500 mt-4 text-sm">ESC ile devam et</p>
        `;
        this.container.appendChild(this.pauseOverlay);

        this.pauseOverlay.querySelector('#resumeBtn').onclick = () => this.resume();
        this.pauseOverlay.querySelector('#exitBtn').onclick = () => {
            this.stop();
            window.closeModal();
        };
    }

    resume() {
        if (!this.isPaused) return;
        this.isPaused = false;
        if (this.pauseOverlay) {
            this.pauseOverlay.remove();
            this.pauseOverlay = null;
        }
        this.lastTime = performance.now();
        requestAnimationFrame(t => this.loop(t));
        window.Audio?.play('click');
    }

    loop(timestamp) {
        if (!this.isRunning || this.isPaused) return;
        // Cap deltaTime at 100ms for frame-rate independence
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        // Update screen shake
        if (this.shakeDuration > 0) {
            this.shakeDuration -= dt;
            this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
        } else {
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
        }

        this.update(dt);
        this.draw();

        requestAnimationFrame(t => this.loop(t));
    }

    // Screen shake utility
    shake(intensity = 5, duration = 0.2) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    }

    // Apply shake to canvas context
    applyShake(ctx) {
        ctx.translate(this.shakeOffsetX, this.shakeOffsetY);
    }

    updateScore(val, relative = true) {
        if (relative) this.score += val;
        else this.score = val;
        this.scoreDisplay.innerText = this.score;
    }

    gameOver(msg = "OYUN BİTTİ") {
        this.stop();
        window.Audio?.play('gameover');

        const overlay = document.createElement('div');
        overlay.className = 'absolute inset-0 flex items-center justify-center flex-col bg-black/60 backdrop-blur-sm z-50 overflow-auto py-4';
        overlay.innerHTML = `
            <h2 class="text-4xl font-display text-red-500 font-bold mb-4">${msg}</h2>
            <p class="text-white text-xl">Skor: <span class="text-neon-green">${this.score}</span></p>
            <button onclick="window.Engine.restart()" class="mt-6 px-6 py-2 bg-neon-blue text-black font-bold rounded hover:scale-105 transition-transform">TEKRAR OYNA</button>
            <button onclick="window.closeModal()" class="mt-2 text-gray-400 hover:text-white text-sm mb-4">Çıkış</button>
            
            <!-- Game Over Ad Container (300x250) -->
            <div class="ad-container ad-rectangle mt-4">
                <!-- Google AdSense Rectangle Ad Unit -->
                <!--
                <ins class="adsbygoogle"
                    style="display:inline-block;width:300px;height:250px"
                    data-ad-client="ca-pub-YOUR_PUB_ID_HERE"
                    data-ad-slot="YOUR_AD_SLOT_ID"></ins>
                <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
                -->
            </div>
        `;
        this.container.appendChild(overlay);
        this.onGameOver(this.score);
    }
}

/**
 * Enhanced Particle for visual effects
 */
export class Particle {
    constructor(x, y, color, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx ?? (Math.random() - 0.5) * (options.speed ?? 6);
        this.vy = options.vy ?? (Math.random() - 0.5) * (options.speed ?? 6);
        this.life = options.life ?? 1;
        this.decay = options.decay ?? 2;
        this.color = color;
        this.size = options.size ?? (Math.random() * 4 + 2);
        this.gravity = options.gravity ?? 0;
        this.friction = options.friction ?? 1;
    }

    update(dt) {
        this.vy += this.gravity * dt;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;
        this.life -= dt * this.decay;
    }

    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, color, count = 15, options = {}) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, options));
        }
    }

    // Explosion effect with outward velocity
    explode(x, y, color, count = 20, speed = 150) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const spd = speed * (0.5 + Math.random() * 0.5);
            this.particles.push(new Particle(x, y, color, {
                vx: Math.cos(angle) * spd * 0.02,
                vy: Math.sin(angle) * spd * 0.02,
                gravity: 100,
                decay: 1.5,
                size: Math.random() * 5 + 2
            }));
        }
    }

    update(dt) {
        this.particles = this.particles.filter(p => {
            p.update(dt);
            return p.life > 0;
        });
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }

    clear() {
        this.particles = [];
    }
}

