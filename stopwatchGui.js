import { stopwatchConfig, getStopwatchQuote } from './games/stopwatch.js';
import StopwatchRound from './games/stopwatchRound.js';
import { gameState } from './gameData.js';
import { ownsApartment, APARTMENT_REQUIRED } from './playerAccess.js';

export function setupStopwatchGui(gui, world, player, seed, payouts) {
    let round = null, mode = null, readSince = null, clock, status, start, target, wager, preview;
    const visible = () => gui.isOpen && gui.active === 'stopwatch';
    const node = (tag, text, cls = '') => {
        const el = document.createElement(tag); el.textContent = text; el.className = cls; return el;
    };
    const button = (text, action) => {
        const el = node('button', text, 'coin-back'); el.type = 'button'; el.addEventListener('click', action); return el;
    };
    function menu(content) {
        mode = null; gui.setBack(); content.replaceChildren(node('h2', 'Stopwatch'));
        content.append(node('p', 'Choose your precision. Set a target, start the clock, then stop on that time. Minimum wager: $1.'));
        const list = node('div', '', 'coin-categories');
        for (const [id, config] of Object.entries(stopwatchConfig.modes)) {
            const option = button(`${config.label} — ${config.minMultiplier}–${config.maxMultiplier}×`, () => details(content, id));
            option.className = 'coin-category'; list.append(option);
        }
        content.append(list, button('Close', () => gui.close()));
    }
    function details(content, id) {
        mode = id;
        gui.setBack(() => { if (round && !round.result) round.stop(performance.now(), true); menu(content); });
        content.replaceChildren(button('← Modes', () => gui.back()), node('h2', stopwatchConfig.modes[id].label));
        const fields = node('div', '', 'stopwatch-fields');
        function field(text, value, step) {
            const label = node('label', text, 'coin-wager-label');
            const input = node('input', ''); input.type = 'number'; input.value = value; input.step = step; input.min = step;
            label.append(input); fields.append(label); return input;
        }
        target = field('Target (seconds)', ['oneDecimal','twoDecimals','twoDecimalsFast'].includes(id) ? '3.5' : '2.394', String(10 ** -stopwatchConfig.modes[id].decimals));
        wager = field('Wager ($)', '25', '0.01'); wager.min = '1';
        preview = node('p', '', 'coin-preview');
        clock = node('div', '0.000', 'stopwatch-clock');
        status = node('p', '', 'coin-result'); status.setAttribute('aria-live', 'polite');
        start = button('Start', () => {
            if (round && !round.result) { round.stop(); readSince = null; update(); return; }
            try {
                if (!ownsApartment(player)) throw new Error(APARTMENT_REQUIRED);
                round = new StopwatchRound(gameState, payouts, target.value, id, seed, Number(wager.value));
                readSince = null; update(); start.focus();
            } catch (error) { status.textContent = error.message; }
        }); start.className = 'coin-flip-button';
        const quote = () => {
            try {
                const q = getStopwatchQuote(target.value, { mode: id, gameSeed: seed });
                preview.textContent = `${q.multiplier}× return · ${q.speed}× speed · ${q.toleranceMs ? 'Within ±5ms of target' : 'Match the displayed time exactly'}`;
            } catch (error) { preview.textContent = error.message; }
        };
        target.addEventListener('input', quote); quote();
        content.append(fields, preview, clock, start, status,
            node('p', 'Click Stop or press Space. Multipliers include your wager. The clock uses real elapsed time, including time in another tab. Leaving a running round forfeits the wager.', 'coin-rules'));
        update();
    }
    function update() {
        const now = performance.now();
        if (round && !round.result && !visible()) round.stop(now, true);
        round?.update(now);
        if (!visible() || !mode || !clock) return;
        const active = round && !round.result;
        target.disabled = wager.disabled = !!active;
        start.textContent = active ? 'Stop' : 'Start';
        if (!round) return;
        const q = round.quote;
        clock.textContent = ((round.result?.displayedMilliseconds ?? Math.round((now - round.startedAt) * q.speed / q.resolutionMs) * q.resolutionMs) / 1000).toFixed(q.decimals);
        if (active) status.textContent = `Target: ${q.targetSeconds.toFixed(q.decimals)} · ${q.multiplier}×`;
        else {
            if (!document.hidden && readSince === null) readSince = now;
            status.textContent = `${round.result.won ? `Won! Returned $${round.result.payout.toFixed(2)}` : `Lost $${round.wager.toFixed(2)}`} · Target ${q.targetSeconds.toFixed(q.decimals)}s`;
        }
    }
    gui.register('stopwatch', { label: 'Stopwatch', className: 'coin-modal stopwatch-modal', render(content) { menu(content); } });
    window.addEventListener('keydown', event => {
        if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.target?.isContentEditable || ['INPUT','TEXTAREA','SELECT'].includes(event.target?.tagName)) return;
        if (visible() && event.code === 'Space' && round && !round.result) {
            event.preventDefault(); round.stop(); readSince = null; update();
        }
        if (event.code === 'KeyR' && !event.defaultPrevented && world.scene === 'casino' && !document.body.classList.contains('game-paused')) {
            if (visible()) { event.preventDefault(); gui.close(); }
            else if (!gui.isOpen && world.casinoInterior.canPlayStopwatch(player)) { event.preventDefault(); gui.open('stopwatch'); }
        }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) readSince = null; });
    return { update, get blocksGameOver() {
        return !!round && ((!round.result && !round.ticket.settled) ||
            (visible() && mode && (document.hidden || readSince === null || performance.now() - readSince < 2000)));
    }};
}
