import { ownsApartment, APARTMENT_REQUIRED } from './playerAccess.js';
import CoinFlip, { coinFlipOptions, MINIMUM_COIN_BET, validateCoinBet } from './coinFlip.js';
import { gameState } from './gameData.js';

const FLIP_DURATION_MS = 1100;
const RESULT_READ_MS = 2000;
const dollars = value => `$${value.toFixed(2)}`;

export function setupCoinFlipGui(gui, world, player, seed, payouts) {
    const game = new CoinFlip(seed, () => ownsApartment(player), payouts);
    let count = null, selected = null, wager = '25', flippingUntil = 0;
    let balanceLabel, input, flipButton, preview, status, stage, outcomeButtons = [], backButton;
    let renderedRound = null;
    let resultVisibleSince = null;
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) resultVisibleSince = null;
    });
    const node = (tag, text, className = '') => {
        const el = document.createElement(tag); el.textContent = text; el.className = className; return el;
    };
    const isFlipping = () => performance.now() < flippingUntil;
    function header(content, title) {
        const bar = node('header', '', 'coin-header');
        const heading = node('div', '');
        heading.append(node('small', 'THE GRAND CASINO'), node('h2', title));
        const right = node('div', '', 'coin-header-actions');
        balanceLabel = node('span', '', 'coin-wallet');
        const close = node('button', 'Close', 'coin-back'); close.type = 'button';
        close.addEventListener('click', () => gui.close());
        right.append(balanceLabel, close); bar.append(heading, right); content.append(bar);
    }
    function categories(content) {
        gui.setBack();
        count = selected = null; input = flipButton = preview = stage = backButton = null;
        outcomeButtons = []; renderedRound = null;
        content.replaceChildren(); header(content, 'Coin Flip');
        content.append(node('p', ownsApartment(player) ? 'Choose how many coins to flip. Minimum bet: $25.' : APARTMENT_REQUIRED, 'coin-intro'));
        const list = node('div', '', 'coin-categories');
        for (let n = 1; n <= 5; n++) {
            const button = node('button', '', 'coin-category'); button.type = 'button';
            const symbol = node('span', '◉'.repeat(n), 'coin-category-symbol'); symbol.setAttribute('aria-hidden', 'true');
            button.append(symbol, node('strong', `${n} ${n === 1 ? 'coin' : 'coins'}`), node('span', 'Choose outcome →'));
            button.addEventListener('click', () => details(content, n)); list.append(button);
        }
        content.append(list);
        status = node('p', '', 'coin-result'); status.setAttribute('aria-live', 'polite'); content.append(status);
        if (game.lastRound) status.textContent = summary(game.lastRound);
        update();
    }
    function summary(round) {
        return `${round.heads} ${round.heads === 1 ? 'head' : 'heads'}, ${round.tails} ${round.tails === 1 ? 'tail' : 'tails'} · ${round.won ? `Won! Returned ${dollars(round.payout)} (profit ${dollars(round.net)})` : `Lost ${dollars(round.wager)}`}.`;
    }
    function drawCoins(round = null, flipping = false) {
        stage.replaceChildren(); stage.classList.toggle('coin-flipping', flipping);
        for (let i = 0; i < count; i++) {
            const face = round?.coins[i];
            const coin = node('span', flipping || !face ? '?' : face === 'heads' ? 'H' : 'T', 'coin-disc');
            coin.style.setProperty('--coin-delay', `${i * 55}ms`);
            coin.dataset.face = face ?? 'unknown';
            coin.setAttribute('aria-label', flipping ? 'Flipping' : face ?? 'Coin');
            stage.append(coin);
        }
    }
    function details(content, n) {
        gui.setBack(() => { if (!isFlipping()) categories(content); });
        count = n; selected = null; renderedRound = null;
        content.replaceChildren(); header(content, `${n} ${n === 1 ? 'coin' : 'coins'}`);
        backButton = node('button', '← Coin counts', 'coin-back'); backButton.type = 'button';
        backButton.addEventListener('click', () => gui.back());
        content.append(backButton);
        const layout = node('div', '', 'coin-layout');
        const options = node('section', '', 'coin-options');
        options.setAttribute('aria-label', 'Choose the winning outcome');
        options.append(node('h3', 'Choose your outcome'));
        outcomeButtons = [];
        for (const option of coinFlipOptions[n]) {
            const button = node('button', '', 'coin-option'); button.type = 'button';
            button.setAttribute('aria-pressed', 'false');
            button.append(node('span', option.label), node('strong', `${option.multiplier}×`));
            button.addEventListener('click', () => {
                if (isFlipping()) return;
                selected = option.id; update();
            });
            outcomeButtons.push({ button, id: option.id }); options.append(button);
        }
        const play = node('section', '', 'coin-play');
        stage = node('div', '', 'coin-stage');
        drawCoins(game.lastRound?.count === count ? game.lastRound : null, isFlipping());
        const label = node('label', 'Wager ($)', 'coin-wager-label');
        input = document.createElement('input'); input.type = 'number'; input.min = String(MINIMUM_COIN_BET);
        input.step = '0.01'; input.inputMode = 'decimal'; input.value = wager;
        input.addEventListener('input', () => { wager = input.value; update(); }); label.append(input);
        preview = node('p', '', 'coin-preview');
        flipButton = node('button', 'Flip coins', 'coin-flip-button'); flipButton.type = 'button';
        flipButton.addEventListener('click', () => {
            if (isFlipping()) return;
            const now = performance.now();
            const result = game.play(gameState, count, selected, Number(input.value), FLIP_DURATION_MS, now);
            if (!result.ok) { status.textContent = result.error; return; }
            flippingUntil = now + FLIP_DURATION_MS;
            resultVisibleSince = null;
            renderedRound = null;
            drawCoins(null, true);
            status.dataset.result = '';
            status.textContent = 'Flipping…';
            update();
        });
        status = node('p', '', 'coin-result'); status.setAttribute('aria-live', 'polite');
        play.append(stage, label, preview, flipButton, status);
        layout.append(options, play); content.append(layout);
        content.append(node('p', 'Each coin is 50/50. Majority includes all heads or all tails; ties lose majority bets. Multipliers include your original wager.', 'coin-rules'));
        gui.dialog.scrollTop = 0; update();
    }
    function update() {
        if (!balanceLabel) return;
        const flipping = isFlipping();
        // The shared payout service credits winnings when the result is revealed.
        balanceLabel.textContent = `Balance: ${dollars(gameState.balance)}`;
        if (!flipping && game.lastRound && !document.hidden && resultVisibleSince === null) {
            resultVisibleSince = performance.now();
        }
        if (!count || !input) return;
        input.disabled = flipping; backButton.disabled = flipping;
        if (flipping) status.textContent = 'Flipping…';
        for (const {button, id} of outcomeButtons) {
            button.disabled = flipping; button.setAttribute('aria-pressed', String(selected === id));
        }
        const bet = Number(input.value);
        const error = ownsApartment(player) ? validateCoinBet(gameState, count, selected, bet) : APARTMENT_REQUIRED;
        flipButton.disabled = flipping || !!error;
        flipButton.textContent = flipping ? 'Flipping…' : `Flip ${count === 1 ? 'coin' : 'coins'}`;
        const option = coinFlipOptions[count].find(option => option.id === selected);
        preview.textContent = error ?? `Return on win: ${dollars(Math.round(bet * 100 * option.multiplier) / 100)}`;
        if (!flipping && game.lastRound?.count === count && renderedRound !== game.lastRound.id) {
            renderedRound = game.lastRound.id; drawCoins(game.lastRound);
            status.textContent = summary(game.lastRound);
            status.dataset.result = game.lastRound.won ? 'win' : 'loss';
        }
    }
    gui.register('coin-flip', { label: 'Coin Flip', className: 'coin-modal', render(content) {
        if (count) details(content, count); else categories(content);
    }});
    window.addEventListener('keydown', event => {
        if (event.code !== 'KeyR' || event.repeat || event.ctrlKey || event.metaKey || event.altKey ||
            event.target?.isContentEditable || ['INPUT','TEXTAREA','SELECT'].includes(event.target?.tagName) ||
            world.scene !== 'casino' || document.body.classList.contains('game-paused')) return;
        if (gui.isOpen) {
            if (gui.active === 'coin-flip') { event.preventDefault(); gui.close(); }
        } else if (world.casinoInterior.canPlayCoinFlip(player)) {
            event.preventDefault(); gui.open('coin-flip');
        }
    });
    return {
        update() { if (gui.isOpen && gui.active === 'coin-flip') update(); },
        get blocksGameOver() {
            // Closing the game deliberately dismisses its result; otherwise let it be read.
            return gui.isOpen && gui.active === 'coin-flip' && game.lastRound !== null &&
                (isFlipping() || document.hidden || resultVisibleSince === null ||
                    performance.now() - resultVisibleSince < RESULT_READ_MS);
        },
    };
}
