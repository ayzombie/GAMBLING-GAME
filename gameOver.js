export const DEATH_MESSAGE_MS = 3000;
export const BLACK_SCREEN_MS = 2000;

export function hasLost(player, wallet) {
    return Number.isFinite(wallet.balance) && wallet.balance <= 0 && player.miners.length === 0;
}

export function gameOverStage(elapsed) {
    if (elapsed < DEATH_MESSAGE_MS) return 'message';
    if (elapsed < DEATH_MESSAGE_MS + BLACK_SCREEN_MS) return 'black';
    return 'retry';
}

export default class GameOver {
    constructor(player, wallet, onStart, restart = () => window.location.reload()) {
        Object.assign(this, { player, wallet, onStart, restart });
        this.active = false;
        this.canStart = () => true;
        this.stage = null;
        this.screen = document.createElement('dialog');
        this.screen.className = 'game-over-screen';
        this.screen.setAttribute('aria-label', 'Game over');
        this.message = document.createElement('div');
        const title = document.createElement('h1'); title.textContent = 'Game Over';
        const text = document.createElement('p'); text.textContent = 'You ran out of money. You died a homeless death.';
        this.message.append(title, text);
        this.retry = document.createElement('button'); this.retry.type = 'button';
        this.retry.textContent = 'Retry?'; this.retry.hidden = true;
        this.retry.addEventListener('click', () => { if (this.stage === 'retry') this.restart(); });
        this.screen.append(this.message, this.retry);
        document.body.append(this.screen);
        this.screen.addEventListener('cancel', event => event.preventDefault());
        window.addEventListener('keydown', event => {
            if (!this.active) return;
            event.stopImmediatePropagation();
            if (this.stage !== 'retry' || !['Tab', 'Enter', 'Space'].includes(event.code)) event.preventDefault();
        }, true);
    }
    update(now = performance.now()) {
        if (!this.active) {
            if (!hasLost(this.player, this.wallet) || !this.canStart()) return;
            this.active = true;
            this.startedAt = now;
            this.player.keys = {};
            this.onStart();
            document.body.classList.add('game-over');
            this.screen.showModal();
        }
        const stage = gameOverStage(now - this.startedAt);
        if (stage === this.stage) return;
        this.stage = stage;
        this.screen.dataset.stage = stage;
        this.message.hidden = stage !== 'message';
        this.retry.hidden = stage !== 'retry';
        if (stage === 'retry') this.retry.focus();
    }
}
