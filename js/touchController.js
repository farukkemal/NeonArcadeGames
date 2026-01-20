/**
 * Touch Controller Module
 * Handles virtual gamepad inputs and gesture recognition
 * Maps touch events to keyboard events for game compatibility
 */

// Check if mobile device
export const isMobile = () => window.innerWidth <= 768 || 'ontouchstart' in window;

// Key mapping for virtual buttons
const keyMap = {
    'vpad-up': 'ArrowUp',
    'vpad-down': 'ArrowDown',
    'vpad-left': 'ArrowLeft',
    'vpad-right': 'ArrowRight',
    'vpad-action': ' ' // Space
};

// Dispatch keyboard event
function dispatchKey(key, type) {
    const event = new KeyboardEvent(type, {
        key: key,
        code: key === ' ' ? 'Space' : key,
        bubbles: true,
        cancelable: true
    });
    window.dispatchEvent(event);
}

// Initialize virtual gamepad
export function initVirtualGamepad() {
    const gamepad = document.getElementById('virtualGamepad');
    if (!gamepad) return;

    Object.keys(keyMap).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        // Touch start - key down
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            btn.classList.add('pressed');
            dispatchKey(keyMap[btnId], 'keydown');
        }, { passive: false });

        // Touch end - key up
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            btn.classList.remove('pressed');
            dispatchKey(keyMap[btnId], 'keyup');
        }, { passive: false });

        // Handle touch cancel
        btn.addEventListener('touchcancel', (e) => {
            btn.classList.remove('pressed');
            dispatchKey(keyMap[btnId], 'keyup');
        });
    });
}

// Show/hide gamepad based on game state
export function showGamepad(show = true) {
    const gamepad = document.getElementById('virtualGamepad');
    if (gamepad) {
        if (show && isMobile()) {
            gamepad.classList.add('active');
        } else {
            gamepad.classList.remove('active');
        }
    }
}

// Swipe gesture detection
export class SwipeDetector {
    constructor(element, callback) {
        this.element = element;
        this.callback = callback;
        this.startX = 0;
        this.startY = 0;
        this.minSwipeDistance = 50;

        this.element.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: true });
        this.element.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: true });
    }

    onTouchStart(e) {
        const touch = e.touches[0];
        this.startX = touch.clientX;
        this.startY = touch.clientY;
    }

    onTouchEnd(e) {
        if (!e.changedTouches[0]) return;

        const touch = e.changedTouches[0];
        const dx = touch.clientX - this.startX;
        const dy = touch.clientY - this.startY;

        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (Math.max(absDx, absDy) < this.minSwipeDistance) return;

        let direction;
        if (absDx > absDy) {
            direction = dx > 0 ? 'right' : 'left';
        } else {
            direction = dy > 0 ? 'down' : 'up';
        }

        this.callback(direction);

        // Also dispatch corresponding key event
        const keyMap = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
        dispatchKey(keyMap[direction], 'keydown');
        setTimeout(() => dispatchKey(keyMap[direction], 'keyup'), 50);
    }
}

// Tap detector (for jump games)
export class TapDetector {
    constructor(element, callback) {
        this.element = element;
        this.callback = callback;

        this.element.addEventListener('touchstart', (e) => {
            // Prevent scroll when tapping on game canvas
            if (e.target.tagName === 'CANVAS') {
                e.preventDefault();
            }
            this.callback();
        }, { passive: false });
    }
}

// Prevent scroll on game container
export function preventScrollOnTouch(element) {
    element.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
}

// Touch coordinate tracker (for Slicer game)
export class TouchTracker {
    constructor(canvas, callback) {
        this.canvas = canvas;
        this.callback = callback;
        this.isTracking = false;

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isTracking = true;
            this.handleTouch(e);
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isTracking) this.handleTouch(e);
        }, { passive: false });

        canvas.addEventListener('touchend', () => {
            this.isTracking = false;
        });
    }

    handleTouch(e) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        this.callback(x, y, this.isTracking);
    }
}
