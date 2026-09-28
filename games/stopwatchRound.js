import { getStopwatchQuote, evaluateStopwatchStop } from './stopwatch.js';

// A round owns its wager and immutable quote; closing the screen never refunds it.
export default class StopwatchRound {
    constructor(wallet, payouts, target, mode, gameSeed, wager, now = performance.now()) {
        this.quote = getStopwatchQuote(target, { mode, gameSeed });
        const cents = Math.round(wager * 100);
        if (!Number.isFinite(wager) || cents < 100 || Math.abs(wager * 100 - cents) > 0.000001 ||
            !Number.isSafeInteger(cents) || cents > Math.round(wallet.balance * 100) ||
            !Number.isSafeInteger(Math.round(cents * this.quote.multiplier))) {
            throw new Error('Enter a wager of at least $1, in cents, within your balance.');
        }
        this.startedAt = now;
        this.deadline = now + (this.quote.targetMilliseconds + 1000) / this.quote.speed;
        this.wager = cents / 100;
        this.payouts = payouts;
        this.ticket = payouts.schedule(wallet, cents, 0, this.deadline - now, now);
        this.result = null;
    }
    stop(now = performance.now(), forfeit = false) {
        if (this.result) return this.result;
        const result = evaluateStopwatchStop(now - this.startedAt, this.quote);
        result.won = result.won && !forfeit && now < this.deadline && !this.ticket.settled;
        result.payout = result.won ? Math.round(this.wager * 100 * this.quote.multiplier) / 100 : 0;
        this.result = result;
        this.ticket.payoutCents = Math.round(result.payout * 100);
        this.ticket.dueAt = now;
        this.payouts.update(now);
        return result;
    }
    update(now = performance.now()) {
        if (!this.result && now >= this.deadline) this.stop(now, true);
    }
}
