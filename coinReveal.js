export function coinRevealTiming(count) {
    const perCoin = count <= 2 ? 3000 : count === 3 ? 2000 : 1200;
    return { perCoin, total: perCoin * count };
}

// Ballistic flights under gravity, with each bounce retaining 1/3 of its velocity.
// The coin's final face follows the already-rolled outcome; animation never rerolls it.
export function sampleCoinMotion(elapsed, duration, face) {
    const progress = Math.max(0, Math.min(1, elapsed / duration));
    const gravity = 8 / (0.66 ** 2);
    let start = 0, flight = 0.66, height = 0;
    for (let bounce = 0; bounce < 4; bounce++) {
        if (progress >= start && progress < start + flight) {
            const time = progress - start;
            height = Math.max(0, gravity * flight / 2 * time - gravity * time * time / 2);
            break;
        }
        start += flight;
        flight /= 3;
    }
    const endRotation = 360 * 5 + (face === 'tails' ? 180 : 0);
    const spin = Math.min(1, progress / 0.66);
    const wobble = progress > 0.66 ? Math.sin((progress - 0.66) * 65) * 28 * (1 - progress) / 0.34 : 0;
    return {
        height,
        rotation: endRotation * (1 - (1 - spin) ** 2) + wobble,
        tilt: Math.sin(progress * Math.PI * 4) * 12 * (1 - progress),
        landed: progress === 1,
    };
}

export default class CoinReveal {
    constructor(content, round, startedAt, onBack) {
        Object.assign(this, { round, startedAt });
        this.timing = coinRevealTiming(round.count);
        content.replaceChildren();
        const node = (tag, text, className = '') => {
            const el = document.createElement(tag); el.textContent = text; el.className = className; return el;
        };
        const header = node('header', '', 'reveal-header');
        header.append(node('small', 'THE GRAND CASINO'), node('h2', 'Coin Flip'),
            node('p', `${round.label} · ${round.multiplier}× · Wager $${round.wager.toFixed(2)}`));
        this.counter = node('p', '', 'reveal-counter');
        const arena = node('div', '', 'reveal-arena');
        arena.setAttribute('aria-hidden', 'true');
        arena.style.setProperty('--coin-count', round.count);
        const row = node('div', '', 'reveal-coins');
        this.models = round.coins.map(() => {
            const slot = node('div', '', 'reveal-coin-slot');
            slot.style.visibility = 'hidden';
            const shadow = node('div', '', 'reveal-shadow');
            const rig = node('div', '', 'reveal-rig');
            const coin = node('div', '', 'reveal-coin');
            for (const [face, symbol] of [['heads', '♛'], ['tails', '♦']]) {
                const side = node('div', '', `reveal-face reveal-${face}`);
                side.append(node('span', 'GRAND CASINO', 'reveal-engraving'), node('strong', symbol), node('span', face.toUpperCase(), 'reveal-face-label'));
                coin.append(side);
            }
            // Each model keeps its own faces, rim, shadow, and final orientation.
            for (const z of [-5,-3,-1,1,3,5]) {
                const edge = node('div', '', 'reveal-edge');
                edge.style.transform = `translateZ(${z}px)`; coin.append(edge);
            }
            rig.append(coin); slot.append(shadow, rig); row.append(slot);
            return { slot, shadow, rig, coin };
        });
        arena.append(row);
        this.results = node('div', '', 'reveal-results');
        this.chips = round.coins.map((_, index) => {
            const chip = node('span', `${index + 1}`, 'reveal-result-coin');
            chip.setAttribute('aria-label', `Coin ${index + 1}: waiting`);
            this.results.append(chip); return chip;
        });
        this.status = node('p', 'Watch the coin…', 'reveal-status');
        this.status.setAttribute('aria-live', 'polite');
        this.back = node('button', 'Back to bets', 'coin-flip-button'); this.back.type = 'button'; this.back.hidden = true;
        this.back.addEventListener('click', onBack);
        const footer = node('footer', '', 'reveal-footer');
        footer.append(this.results, this.status, this.back);
        content.append(header, this.counter, arena, footer);
        this.lastIndex = -1;
        this.finished = false;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    update(now) {
        const elapsed = Math.max(0, now - this.startedAt);
        const completed = Math.min(this.round.count, Math.floor(elapsed / this.timing.perCoin));
        const index = Math.min(completed, this.round.count - 1);
        const localTime = completed === this.round.count ? this.timing.perCoin : elapsed - index * this.timing.perCoin;
        const motion = sampleCoinMotion(localTime, this.timing.perCoin, this.round.coins[index]);
        if (index !== this.lastIndex) {
            this.lastIndex = index;
            this.counter.textContent = `COIN ${index + 1} OF ${this.round.count}`;
        }
        for (let i = 0; i < this.models.length; i++) {
            const model = this.models[i];
            model.slot.style.visibility = i <= index ? 'visible' : 'hidden';
            if (i > index) continue;
            const pose = i < completed
                ? sampleCoinMotion(this.timing.perCoin, this.timing.perCoin, this.round.coins[i])
                : motion;
            const lift = this.reducedMotion ? 0 : pose.height;
            model.rig.style.transform = `translateY(calc(var(--toss-height) * ${-lift}))`;
            const rotation = this.reducedMotion ? (pose.landed && this.round.coins[i] === 'tails' ? 180 : 0) : pose.rotation;
            model.coin.style.transform = `rotateZ(${this.reducedMotion ? 0 : pose.tilt}deg) rotateX(${rotation}deg)`;
            model.shadow.style.transform = `translateX(-50%) scale(${1 - lift * .5})`;
            model.shadow.style.opacity = String(.65 - lift * .4);
        }
        for (let i = 0; i < this.chips.length; i++) {
            const revealed = i < completed;
            this.chips[i].classList.toggle('revealed', revealed);
            this.chips[i].classList.toggle('current', i === index && !motion.landed);
            this.chips[i].textContent = revealed ? (this.round.coins[i] === 'heads' ? 'H' : 'T') : String(i + 1);
            this.chips[i].setAttribute('aria-label', `Coin ${i + 1}: ${revealed ? this.round.coins[i] : 'waiting'}`);
        }
        if (completed === this.round.count && !this.finished) {
            this.finished = true;
            this.counter.textContent = 'RESULT';
            const r = this.round;
            this.status.textContent = `${r.heads} heads · ${r.tails} tails — ${r.won ? `Won! $${r.payout.toFixed(2)} returned (+$${r.net.toFixed(2)} profit).` : `Lost $${r.wager.toFixed(2)}.`}`;
            this.status.dataset.result = r.won ? 'win' : 'loss';
            this.back.hidden = false;
        } else if (!this.finished) {
            this.status.textContent = completed ? `Coin ${completed}: ${this.round.coins[completed - 1].toUpperCase()}. Next coin…` : 'Watch the coin…';
        }
        return this.finished;
    }
}
