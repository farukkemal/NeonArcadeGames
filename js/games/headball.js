/**
 * Cosmic Head Ball v2.1 - 1v1 Space Soccer
 * Features: Menu system, 2-player local, AI difficulty, goal post physics, player collision
 */
import { Game, ParticleSystem } from './Game.js';

export class HeadballGame extends Game {
    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 700;
        this.canvas.height = 400;
        this.canvas.className = "border-2 border-violet-500 shadow-[0_0_30px_#8b5cf6] bg-black max-w-full";
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.particles = new ParticleSystem();

        // Game State: MENU, DIFFICULTY, COUNTDOWN, PLAYING
        this.gameState = 'MENU';
        this.gameMode = null; // '1P' or '2P'
        this.difficulty = null;
        this.countdownValue = 3;
        this.countdownTimer = 0;

        // Physics constants - TUNED
        this.playerGravity = 800;     // Normal gravity for players
        this.ballGravity = 400;       // Half gravity for ball (moon physics)
        this.groundY = this.canvas.height - 50;
        this.friction = 0.995;        // Less air friction for floaty ball
        this.groundFriction = 0.92;

        // Match settings
        this.matchTime = 90;
        this.timeRemaining = this.matchTime;
        this.scoreLeft = 0;
        this.scoreRight = 0;
        this.goalCooldown = 0;

        // Stars background
        this.stars = this.generateStars(150);
        this.nebulae = this.generateNebulae(3);

        // Goal dimensions - L-shaped design
        this.goalWidth = 15;              // Goal depth
        this.goalHeight = 100;            // Vertical post height
        this.crossbarLength = 70;         // Horizontal crossbar extends into field
        this.goalY = this.groundY - this.goalHeight;
        this.postThickness = 10;          // Thicker neon posts

        // Goal post colliders (L-shaped)
        // Left goal: reverse L shape
        this.goalPosts = {
            left: [
                // Vertical back post
                { x: 0, y: this.goalY, w: this.postThickness, h: this.goalHeight },
                // Horizontal crossbar extending into field
                { x: 0, y: this.goalY - this.postThickness, w: this.crossbarLength, h: this.postThickness },
                // Front post (just visual marker at crossbar end)
                { x: this.crossbarLength - this.postThickness, y: this.goalY - this.postThickness, w: this.postThickness, h: this.postThickness + 5 }
            ],
            right: [
                // Vertical back post
                { x: this.canvas.width - this.postThickness, y: this.goalY, w: this.postThickness, h: this.goalHeight },
                // Horizontal crossbar extending into field
                { x: this.canvas.width - this.crossbarLength, y: this.goalY - this.postThickness, w: this.crossbarLength, h: this.postThickness },
                // Front post
                { x: this.canvas.width - this.crossbarLength, y: this.goalY - this.postThickness, w: this.postThickness, h: this.postThickness + 5 }
            ]
        };

        this.KICK_COOLDOWN = 600;

        this.initPlayers();

        // Input state
        this.keys = {
            p1Left: false, p1Right: false, p1Up: false, p1Kick: false,
            p2Left: false, p2Right: false, p2Up: false, p2Kick: false
        };

        // Menu buttons
        this.menuButtons = [
            { id: '1P', text: 'TEK OYUNCU', x: this.canvas.width / 2 - 100, y: 200, w: 200, h: 50 },
            { id: '2P', text: '2 OYUNCU', x: this.canvas.width / 2 - 100, y: 270, w: 200, h: 50 }
        ];

        this.difficultyButtons = [
            { id: 'easy', text: 'KOLAY', x: this.canvas.width / 2 - 150, y: 180, w: 100, h: 45, color: '#0f0' },
            { id: 'medium', text: 'ORTA', x: this.canvas.width / 2 - 50, y: 180, w: 100, h: 45, color: '#ff0' },
            { id: 'hard', text: 'ZOR', x: this.canvas.width / 2 + 50, y: 180, w: 100, h: 45, color: '#f00' }
        ];

        // Event handlers
        this.keyDownHandler = (e) => this.handleKeyDown(e);
        this.keyUpHandler = (e) => this.handleKeyUp(e);
        this.clickHandler = (e) => this.handleClick(e);

        window.addEventListener('keydown', this.keyDownHandler);
        window.addEventListener('keyup', this.keyUpHandler);
        this.canvas.addEventListener('click', this.clickHandler);
        this.canvas.style.cursor = 'pointer';
    }

    initPlayers() {
        // Player Left (Cyan)
        this.playerLeft = {
            x: 150,
            y: this.groundY,
            vx: 0, vy: 0,
            width: 40, height: 50,
            headRadius: 22,
            color: '#0ff',
            coreColor: '#00ffff',
            grounded: true,
            kicking: false,
            kickTimer: 0,
            canKick: true,
            speed: 200,
            jumpForce: -480          // Calibrated to reach crossbar height
        };

        // Player Right (Fuchsia)
        this.playerRight = {
            x: this.canvas.width - 150,
            y: this.groundY,
            vx: 0, vy: 0,
            width: 40, height: 50,
            headRadius: 22,
            color: '#f0f',
            coreColor: '#ff44ff',
            grounded: true,
            kicking: false,
            kickTimer: 0,
            canKick: true,
            speed: 200,
            jumpForce: -480          // Calibrated to reach crossbar height
        };

        // Ball
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            vx: 0, vy: 0,
            radius: 15
        };
    }

    stop() {
        super.stop();
        window.removeEventListener('keydown', this.keyDownHandler);
        window.removeEventListener('keyup', this.keyUpHandler);
        this.canvas.removeEventListener('click', this.clickHandler);
    }

    generateStars(count) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.groundY - 50),
                size: Math.random() * 2 + 0.5,
                brightness: Math.random(),
                twinkleSpeed: 1 + Math.random() * 3
            });
        }
        return stars;
    }

    generateNebulae(count) {
        const nebulae = [];
        const colors = ['rgba(100, 0, 150, 0.15)', 'rgba(0, 100, 150, 0.12)', 'rgba(150, 50, 100, 0.1)'];
        for (let i = 0; i < count; i++) {
            nebulae.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.groundY - 100),
                radius: 80 + Math.random() * 120,
                color: colors[i % colors.length]
            });
        }
        return nebulae;
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        if (this.gameState === 'MENU') {
            for (const btn of this.menuButtons) {
                if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
                    if (btn.id === '1P') {
                        this.gameMode = '1P';
                        this.gameState = 'DIFFICULTY';
                    } else if (btn.id === '2P') {
                        this.gameMode = '2P';
                        this.startCountdown();
                    }
                    window.Audio?.play('click');
                    break;
                }
            }
        } else if (this.gameState === 'DIFFICULTY') {
            for (const btn of this.difficultyButtons) {
                if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
                    this.difficulty = btn.id;
                    this.applyDifficulty();
                    this.startCountdown();
                    window.Audio?.play('click');
                    break;
                }
            }
        }
    }

    applyDifficulty() {
        const cpu = this.playerRight;
        switch (this.difficulty) {
            case 'easy':
                cpu.speed = 140;
                cpu.jumpForce = -350;
                cpu.reactionDelay = 0.3;
                cpu.jumpChance = 0.3;
                cpu.kickRange = 50;
                break;
            case 'medium':
                cpu.speed = 190;
                cpu.jumpForce = -380;
                cpu.reactionDelay = 0.1;
                cpu.jumpChance = 0.6;
                cpu.kickRange = 60;
                break;
            case 'hard':
                cpu.speed = 220;
                cpu.jumpForce = -420;
                cpu.reactionDelay = 0;
                cpu.predictive = true;
                cpu.jumpChance = 0.9;
                cpu.kickRange = 80;
                break;
        }
    }

    startCountdown() {
        this.gameState = 'COUNTDOWN';
        this.countdownValue = 3;
        this.countdownTimer = 0;
        this.resetPositions();
    }

    handleKeyDown(e) {
        if (this.gameState !== 'PLAYING') {
            e.preventDefault();
            return;
        }

        const code = e.code;

        if (this.gameMode === '2P') {
            // Player 1 (Left): WASD + Space
            if (code === 'KeyA') { this.keys.p1Left = true; e.preventDefault(); }
            if (code === 'KeyD') { this.keys.p1Right = true; e.preventDefault(); }
            if (code === 'KeyW') { this.keys.p1Up = true; e.preventDefault(); }
            if (code === 'Space') { this.keys.p1Kick = true; e.preventDefault(); }

            // Player 2 (Right): Arrows + P
            if (code === 'ArrowLeft') { this.keys.p2Left = true; e.preventDefault(); }
            if (code === 'ArrowRight') { this.keys.p2Right = true; e.preventDefault(); }
            if (code === 'ArrowUp') { this.keys.p2Up = true; e.preventDefault(); }
            if (code === 'KeyP') { this.keys.p2Kick = true; e.preventDefault(); }
        } else {
            // 1P: Arrows + Space
            if (code === 'ArrowLeft') { this.keys.p1Left = true; e.preventDefault(); }
            if (code === 'ArrowRight') { this.keys.p1Right = true; e.preventDefault(); }
            if (code === 'ArrowUp') { this.keys.p1Up = true; e.preventDefault(); }
            if (code === 'Space') { this.keys.p1Kick = true; e.preventDefault(); }
        }
    }

    handleKeyUp(e) {
        const code = e.code;
        if (this.gameMode === '2P') {
            if (code === 'KeyA') this.keys.p1Left = false;
            if (code === 'KeyD') this.keys.p1Right = false;
            if (code === 'KeyW') this.keys.p1Up = false;
            if (code === 'Space') this.keys.p1Kick = false;
            if (code === 'ArrowLeft') this.keys.p2Left = false;
            if (code === 'ArrowRight') this.keys.p2Right = false;
            if (code === 'ArrowUp') this.keys.p2Up = false;
            if (code === 'KeyP') this.keys.p2Kick = false;
        } else {
            if (code === 'ArrowLeft') this.keys.p1Left = false;
            if (code === 'ArrowRight') this.keys.p1Right = false;
            if (code === 'ArrowUp') this.keys.p1Up = false;
            if (code === 'Space') this.keys.p1Kick = false;
        }
    }

    update(dt) {
        this.stars.forEach(star => {
            star.brightness = 0.5 + 0.5 * Math.sin(performance.now() / 1000 * star.twinkleSpeed);
        });
        this.particles.update(dt);

        if (this.gameState === 'COUNTDOWN') {
            this.countdownTimer += dt;
            if (this.countdownTimer >= 1) {
                this.countdownTimer = 0;
                this.countdownValue--;
                if (this.countdownValue <= 0) {
                    this.gameState = 'PLAYING';
                }
                window.Audio?.play('click');
            }
            return;
        }

        if (this.gameState !== 'PLAYING') return;

        // Timer
        if (this.goalCooldown <= 0) {
            this.timeRemaining -= dt;
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.endMatch();
                return;
            }
        } else {
            this.goalCooldown -= dt;
        }

        // Player input
        this.handlePlayerInput(this.playerLeft, this.keys.p1Left, this.keys.p1Right, this.keys.p1Up, this.keys.p1Kick, true);

        if (this.gameMode === '2P') {
            this.handlePlayerInput(this.playerRight, this.keys.p2Left, this.keys.p2Right, this.keys.p2Up, this.keys.p2Kick, false);
        } else {
            this.updateCPU(dt);
        }

        // Physics
        this.updateCharacter(this.playerLeft, true);
        this.updateCharacter(this.playerRight, false);

        // Player vs Player collision
        this.checkPlayerCollision();

        this.updateBall(dt);

        // Collisions
        this.checkHeadBallCollision(this.playerLeft);
        this.checkHeadBallCollision(this.playerRight);
        this.checkKickCollision(this.playerLeft, true);
        this.checkKickCollision(this.playerRight, false);

        // Goal detection
        this.checkGoals();

        this.scoreDisplay.innerText = `${this.scoreLeft} - ${this.scoreRight}`;
    }

    handlePlayerInput(player, left, right, up, kick, isLeftPlayer) {
        if (left) player.vx = -player.speed;
        else if (right) player.vx = player.speed;
        else player.vx *= 0.8;

        if (up && player.grounded) {
            player.vy = player.jumpForce;
            player.grounded = false;
            window.Audio?.play('click');
        }

        if (kick && !player.kicking && player.canKick) {
            player.kicking = true;
            player.kickTimer = 0.15;
            player.canKick = false;
            window.Audio?.play('hit');
            setTimeout(() => { player.canKick = true; }, this.KICK_COOLDOWN);
        }
    }

    updateCPU(dt) {
        const cpu = this.playerRight;
        const ball = this.ball;

        if (cpu.reactionDelay && !cpu.lastReactionTime) {
            cpu.lastReactionTime = performance.now();
        }

        const canReact = !cpu.reactionDelay ||
            (performance.now() - (cpu.lastReactionTime || 0)) > cpu.reactionDelay * 1000;

        if (!canReact) return;
        cpu.lastReactionTime = performance.now();

        let targetX = ball.x;
        if (cpu.predictive) {
            const timeToReach = Math.abs(ball.x - cpu.x) / cpu.speed;
            targetX = ball.x + ball.vx * timeToReach * 0.5;
        }

        const ballInOwnHalf = targetX > this.canvas.width / 2;
        const distToBall = Math.hypot(targetX - cpu.x, ball.y - (cpu.y - cpu.height / 2));

        if (ballInOwnHalf || distToBall < 200) {
            if (targetX < cpu.x - 30) cpu.vx = -cpu.speed * 0.9;
            else if (targetX > cpu.x + 30) cpu.vx = cpu.speed * 0.9;
            else cpu.vx *= 0.8;

            if (ball.y < cpu.y - 60 && distToBall < 120 && cpu.grounded) {
                if (Math.random() < (cpu.jumpChance || 0.5)) {
                    cpu.vy = cpu.jumpForce;
                    cpu.grounded = false;
                }
            }

            const kickRange = cpu.kickRange || 60;
            if (distToBall < kickRange && !cpu.kicking && cpu.canKick) {
                cpu.kicking = true;
                cpu.kickTimer = 0.15;
                cpu.canKick = false;
                setTimeout(() => { cpu.canKick = true; }, this.KICK_COOLDOWN);
            }
        } else {
            const defenseX = this.canvas.width - 120;
            if (cpu.x < defenseX - 20) cpu.vx = cpu.speed * 0.5;
            else if (cpu.x > defenseX + 20) cpu.vx = -cpu.speed * 0.5;
            else cpu.vx *= 0.8;
        }

        cpu.x = Math.max(this.canvas.width / 2 + 30, Math.min(this.canvas.width - 40, cpu.x));
    }

    updateCharacter(char, isLeft) {
        const dt = 1 / 60;

        if (!char.grounded) {
            char.vy += this.playerGravity * dt;
        }

        char.x += char.vx * dt;
        char.y += char.vy * dt;

        if (char.y >= this.groundY) {
            char.y = this.groundY;
            char.vy = 0;
            char.grounded = true;
            char.vx *= this.groundFriction;
        }

        // Bounds - FREE ROAM: all players can move across entire field
        char.x = Math.max(30, Math.min(this.canvas.width - 30, char.x));

        if (char.kicking) {
            char.kickTimer -= dt;
            if (char.kickTimer <= 0) char.kicking = false;
        }
    }

    // NEW: Player vs Player collision
    checkPlayerCollision() {
        const p1 = this.playerLeft;
        const p2 = this.playerRight;

        const dx = p2.x - p1.x;
        const dy = (p2.y - p2.height / 2) - (p1.y - p1.height / 2);
        const dist = Math.hypot(dx, dy);
        const minDist = p1.headRadius + p2.headRadius + 10;

        if (dist < minDist && dist > 0) {
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            // Push apart
            p1.x -= nx * overlap * 0.5;
            p2.x += nx * overlap * 0.5;

            // Velocity exchange
            const relVel = (p1.vx - p2.vx) * nx + (p1.vy - p2.vy) * ny;
            if (relVel > 0) {
                p1.vx -= relVel * nx * 0.5;
                p2.vx += relVel * nx * 0.5;
            }
        }
    }

    updateBall(dt) {
        const ball = this.ball;

        // Low gravity (moon physics)
        ball.vy += this.ballGravity * dt;

        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        ball.vx *= this.friction;
        ball.vy *= this.friction;

        // Super bounce ground
        if (ball.y + ball.radius > this.groundY) {
            ball.y = this.groundY - ball.radius;
            ball.vy *= -0.95;
            ball.vx *= 0.98;
        }

        // Ceiling
        if (ball.y - ball.radius < 0) {
            ball.y = ball.radius;
            ball.vy *= -0.95;
        }

        // Goal posts
        this.checkGoalPostCollision(ball, this.goalPosts.left);
        this.checkGoalPostCollision(ball, this.goalPosts.right);

        // Walls (except goal area)
        if (ball.x - ball.radius < this.goalWidth) {
            if (ball.y < this.goalY || ball.y > this.groundY) {
                ball.x = this.goalWidth + ball.radius;
                ball.vx *= -0.95;
            }
        }
        if (ball.x + ball.radius > this.canvas.width - this.goalWidth) {
            if (ball.y < this.goalY || ball.y > this.groundY) {
                ball.x = this.canvas.width - this.goalWidth - ball.radius;
                ball.vx *= -0.95;
            }
        }
    }

    checkGoalPostCollision(ball, posts) {
        for (const post of posts) {
            const closestX = Math.max(post.x, Math.min(ball.x, post.x + post.w));
            const closestY = Math.max(post.y, Math.min(ball.y, post.y + post.h));

            const distX = ball.x - closestX;
            const distY = ball.y - closestY;
            const dist = Math.sqrt(distX * distX + distY * distY);

            if (dist < ball.radius) {
                const overlap = ball.radius - dist;
                if (dist > 0) {
                    const nx = distX / dist;
                    const ny = distY / dist;

                    ball.x += nx * overlap;
                    ball.y += ny * overlap;

                    const dot = ball.vx * nx + ball.vy * ny;
                    ball.vx -= 2 * dot * nx;
                    ball.vy -= 2 * dot * ny;

                    // Hard metallic bounce
                    ball.vx *= 0.95;
                    ball.vy *= 0.95;

                    this.particles.emit(closestX, closestY, '#fff', 12);
                    window.Audio?.play('hit');
                }
            }
        }

        // Anti-camp: If ball is sitting on top of crossbar, push it
        const leftCrossbar = this.goalPosts.left[1];
        const rightCrossbar = this.goalPosts.right[1];

        // Check if ball is on top of left crossbar
        if (ball.x > leftCrossbar.x && ball.x < leftCrossbar.x + leftCrossbar.w &&
            ball.y + ball.radius > leftCrossbar.y - 5 && ball.y + ball.radius < leftCrossbar.y + 10 &&
            Math.abs(ball.vx) < 20 && Math.abs(ball.vy) < 20) {
            ball.vx += 50; // Push toward center
            ball.vy -= 20; // Small upward nudge
        }

        // Check if ball is on top of right crossbar
        if (ball.x > rightCrossbar.x && ball.x < rightCrossbar.x + rightCrossbar.w &&
            ball.y + ball.radius > rightCrossbar.y - 5 && ball.y + ball.radius < rightCrossbar.y + 10 &&
            Math.abs(ball.vx) < 20 && Math.abs(ball.vy) < 20) {
            ball.vx -= 50; // Push toward center
            ball.vy -= 20;
        }
    }

    checkHeadBallCollision(char) {
        const ball = this.ball;
        const headX = char.x;
        const headY = char.y - char.height + char.headRadius;

        const dx = ball.x - headX;
        const dy = ball.y - headY;
        const dist = Math.hypot(dx, dy);
        const minDist = ball.radius + char.headRadius;

        if (dist < minDist && dist > 0) {
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            ball.x += nx * overlap;
            ball.y += ny * overlap;

            const relVx = ball.vx - char.vx;
            const relVy = ball.vy - char.vy;
            const relVel = relVx * nx + relVy * ny;

            if (relVel < 0) {
                const bounce = 1.5;
                ball.vx -= (1 + bounce) * relVel * nx;
                ball.vy -= (1 + bounce) * relVel * ny;
                ball.vx += char.vx * 0.5;
                ball.vy += char.vy * 0.3;

                this.particles.emit(ball.x, ball.y, char.coreColor, 8);
                window.Audio?.play('hit');
            }
        }
    }

    checkKickCollision(char, isLeft) {
        if (!char.kicking) return;

        const ball = this.ball;
        const footX = char.x + (isLeft ? 25 : -25);
        const footY = char.y - 15;

        const dx = ball.x - footX;
        const dy = ball.y - footY;
        const dist = Math.hypot(dx, dy);

        if (dist < ball.radius + 20) {
            // BULLET SHOT - high power
            const kickPower = 1200;
            const kickAngle = isLeft ? -0.3 : Math.PI + 0.3;

            ball.vx = Math.cos(kickAngle) * kickPower;
            ball.vy = Math.sin(kickAngle) * kickPower - 200;

            char.kicking = false;
            this.particles.explode(ball.x, ball.y, char.coreColor, 15, 200);
            window.Audio?.play('win');
        }
    }

    checkGoals() {
        if (this.goalCooldown > 0) return;

        const ball = this.ball;
        const GOAL_POST_WIDTH = 45; // Width of neon posts

        // NEW GOAL LOGIC: whole ball must cross the inner post line
        // Left goal - Right team scores
        if (ball.x + ball.radius < GOAL_POST_WIDTH) {
            this.scoreRight++;
            this.goalScored('right');
            return;
        }

        // Right goal - Left team scores
        if (ball.x - ball.radius > this.canvas.width - GOAL_POST_WIDTH) {
            this.scoreLeft++;
            this.goalScored('left');
            return;
        }
    }

    goalScored(team) {
        this.goalCooldown = 2;
        this.shake(15, 0.5);
        window.Audio?.play('win');

        const color = team === 'left' ? '#0ff' : '#f0f';
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.particles.explode(this.canvas.width / 2, this.canvas.height / 2, color, 30, 300);
            }, i * 100);
        }

        setTimeout(() => this.resetPositions(), 1500);
    }

    resetPositions() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 3;
        this.ball.vx = 0;
        this.ball.vy = 0;

        this.playerLeft.x = 150;
        this.playerLeft.y = this.groundY;
        this.playerLeft.vx = 0;
        this.playerLeft.vy = 0;

        this.playerRight.x = this.canvas.width - 150;
        this.playerRight.y = this.groundY;
        this.playerRight.vx = 0;
        this.playerRight.vy = 0;
    }

    endMatch() {
        let winner;
        if (this.scoreLeft > this.scoreRight) {
            winner = this.gameMode === '2P' ? 'OYUNCU 1 KAZANDI!' : 'TEBRİKLER, KAZANDIN!';
        } else if (this.scoreRight > this.scoreLeft) {
            winner = this.gameMode === '2P' ? 'OYUNCU 2 KAZANDI!' : 'AI KAZANDI!';
        } else {
            winner = 'BERABERE!';
        }
        this.gameOver(`${winner}\n${this.scoreLeft} - ${this.scoreRight}`);
    }

    draw() {
        const ctx = this.ctx;
        this.drawBackground(ctx);

        ctx.save();
        this.applyShake(ctx);

        this.drawGround(ctx);
        this.drawCharacter(ctx, this.playerLeft, true);
        this.drawCharacter(ctx, this.playerRight, false);
        this.drawBall(ctx); // Draw ball before goals for Z-Index trick

        this.drawGoal(ctx, 0, this.goalY, '#0ff', true);
        this.drawGoal(ctx, this.canvas.width - this.goalWidth, this.goalY, '#f0f', false);

        this.particles.draw(ctx);

        ctx.restore();

        if (this.gameState === 'MENU') this.drawMenu(ctx);
        else if (this.gameState === 'DIFFICULTY') this.drawDifficultyMenu(ctx);
        else if (this.gameState === 'COUNTDOWN') this.drawCountdown(ctx);
        else if (this.gameState === 'PLAYING') this.drawHUD(ctx);
    }

    drawBackground(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#000010');
        gradient.addColorStop(0.6, '#0a0020');
        gradient.addColorStop(1, '#050015');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.nebulae.forEach(n => {
            const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
            g.addColorStop(0, n.color);
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.fillRect(n.x - n.radius, n.y - n.radius, n.radius * 2, n.radius * 2);
        });

        this.stars.forEach(star => {
            ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawGround(ctx) {
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#0ff';
        ctx.beginPath();
        ctx.moveTo(0, this.groundY);
        ctx.lineTo(this.canvas.width, this.groundY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        const glow = ctx.createLinearGradient(0, this.groundY, 0, this.canvas.height);
        glow.addColorStop(0, 'rgba(0, 255, 255, 0.15)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, this.groundY, this.canvas.width, 50);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(this.canvas.width / 2, this.groundY - 10);
        ctx.lineTo(this.canvas.width / 2, 50);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    drawGoal(ctx, x, y, color, isLeft) {
        // Goal depth effect (inside goal area)
        ctx.fillStyle = `${color}15`;
        if (isLeft) {
            ctx.fillRect(0, y, this.goalWidth, this.goalHeight);
        } else {
            ctx.fillRect(this.canvas.width - this.goalWidth, y, this.goalWidth, this.goalHeight);
        }

        ctx.fillStyle = color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;

        // Draw all three parts of L-shaped goal
        const posts = isLeft ? this.goalPosts.left : this.goalPosts.right;

        // Vertical back post
        ctx.fillRect(posts[0].x, posts[0].y, posts[0].w, posts[0].h);

        // Horizontal crossbar
        ctx.fillRect(posts[1].x, posts[1].y, posts[1].w, posts[1].h);

        // Front post marker
        ctx.fillRect(posts[2].x, posts[2].y, posts[2].w, posts[2].h);

        ctx.shadowBlur = 0;
    }

    drawCharacter(ctx, char, isLeft) {
        const headX = char.x;
        const headY = char.y - char.height + char.headRadius;

        const footOffset = char.kicking ? 25 : 10;
        const footX = char.x + (isLeft ? footOffset : -footOffset);
        const footY = char.y - 15;

        ctx.fillStyle = char.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = char.color;
        ctx.fillRect(footX - 8, footY - 5, 16, 12);
        ctx.shadowBlur = 0;

        ctx.strokeStyle = char.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(char.x, headY + char.headRadius);
        ctx.lineTo(char.x, char.y - 20);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(headX, headY, char.headRadius, 0, Math.PI * 2);
        const glass = ctx.createRadialGradient(headX - 8, headY - 8, 0, headX, headY, char.headRadius);
        glass.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        glass.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        glass.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
        ctx.fillStyle = glass;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        const coreSize = 10 + Math.sin(performance.now() / 200) * 3;
        const core = ctx.createRadialGradient(headX, headY, 0, headX, headY, coreSize);
        core.addColorStop(0, '#fff');
        core.addColorStop(0.3, char.coreColor);
        core.addColorStop(1, 'transparent');
        ctx.fillStyle = core;
        ctx.shadowBlur = 20;
        ctx.shadowColor = char.coreColor;
        ctx.beginPath();
        ctx.arc(headX, headY, coreSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    drawBall(ctx) {
        const ball = this.ball;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(ball.x, this.groundY + 5, ball.radius * 0.8, ball.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#222';
        const angles = [0, Math.PI * 0.4, Math.PI * 0.8, Math.PI * 1.2, Math.PI * 1.6];
        angles.forEach(a => {
            ctx.beginPath();
            ctx.arc(ball.x + Math.cos(a) * ball.radius * 0.5, ball.y + Math.sin(a) * ball.radius * 0.5, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(ball.x - 4, ball.y - 4, ball.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    drawMenu(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.font = 'bold 48px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#8b5cf6';
        ctx.fillText('COSMIC', this.canvas.width / 2, 100);
        ctx.fillStyle = '#8b5cf6';
        ctx.fillText('HEAD BALL', this.canvas.width / 2, 150);
        ctx.shadowBlur = 0;

        for (const btn of this.menuButtons) {
            const g = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.h);
            g.addColorStop(0, '#8b5cf6');
            g.addColorStop(1, '#6d28d9');
            ctx.fillStyle = g;
            ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
            ctx.strokeStyle = '#a78bfa';
            ctx.lineWidth = 2;
            ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 18px Orbitron';
            ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2 + 6);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px Orbitron';
        ctx.fillText('v2.1 - Fizik Düzeltmesi', this.canvas.width / 2, this.canvas.height - 20);
    }

    drawDifficultyMenu(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.font = 'bold 36px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText('ZORLUK SEÇ', this.canvas.width / 2, 100);

        for (const btn of this.difficultyButtons) {
            ctx.fillStyle = btn.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = btn.color;
            ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#000';
            ctx.font = 'bold 16px Orbitron';
            ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2 + 6);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '11px Orbitron';
        ctx.fillText('Yavaş AI', this.difficultyButtons[0].x + 50, 240);
        ctx.fillText('Normal AI', this.difficultyButtons[1].x + 50, 240);
        ctx.fillText('Agresif AI', this.difficultyButtons[2].x + 50, 240);
    }

    drawCountdown(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.font = 'bold 120px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 50;
        ctx.shadowColor = '#8b5cf6';
        const text = this.countdownValue > 0 ? this.countdownValue.toString() : 'GO!';
        ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2 + 30);
        ctx.shadowBlur = 0;

        ctx.font = '14px Orbitron';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';

        if (this.gameMode === '2P') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(this.canvas.width / 2, 0);
            ctx.lineTo(this.canvas.width / 2, this.canvas.height);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#0ff';
            ctx.fillText('OYUNCU 1', this.canvas.width / 4, this.canvas.height - 80);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fillText('W A S D + SPACE', this.canvas.width / 4, this.canvas.height - 55);

            ctx.fillStyle = '#f0f';
            ctx.fillText('OYUNCU 2', this.canvas.width * 3 / 4, this.canvas.height - 80);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fillText('← ↑ → + P', this.canvas.width * 3 / 4, this.canvas.height - 55);
        } else {
            ctx.fillText('← → Hareket  |  ↑ Zıpla  |  SPACE Şut', this.canvas.width / 2, this.canvas.height - 60);
        }
    }

    drawHUD(ctx) {
        const boardWidth = 200;
        const boardX = (this.canvas.width - boardWidth) / 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(boardX, 5, boardWidth, 40);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(boardX, 5, boardWidth, 40);

        ctx.font = 'bold 24px Orbitron';
        ctx.textAlign = 'center';

        ctx.fillStyle = '#0ff';
        ctx.fillText(this.scoreLeft, boardX + 50, 35);
        ctx.fillStyle = '#fff';
        ctx.fillText('-', this.canvas.width / 2, 35);
        ctx.fillStyle = '#f0f';
        ctx.fillText(this.scoreRight, boardX + boardWidth - 50, 35);

        const mins = Math.floor(this.timeRemaining / 60);
        const secs = Math.floor(this.timeRemaining % 60);
        ctx.fillStyle = this.timeRemaining < 10 ? '#f44' : '#fff';
        ctx.font = 'bold 14px Orbitron';
        ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, this.canvas.width / 2, 58);

        if (this.goalCooldown > 1) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 48px Orbitron';
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#fff';
            ctx.fillText('GOAL!', this.canvas.width / 2, this.canvas.height / 2);
            ctx.shadowBlur = 0;
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '10px Orbitron';
        if (this.gameMode === '1P') {
            const diff = { easy: 'KOLAY', medium: 'ORTA', hard: 'ZOR' };
            ctx.fillText(`1P - ${diff[this.difficulty]}`, this.canvas.width / 2, this.canvas.height - 10);
        } else {
            ctx.fillText('2 OYUNCU', this.canvas.width / 2, this.canvas.height - 10);
        }
    }
}
