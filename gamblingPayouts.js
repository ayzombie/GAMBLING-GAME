// Shared by casino games: debit the wager now, credit the result once it is due.
// Keep updating this service even when the game's menu has been closed.
export default class GamblingPayouts {
    constructor() { this.pending = new Set(); }
    get hasPending() { return this.pending.size > 0; }

    schedule(wallet, wagerCents, payoutCents, delayMs = 0, now = performance.now()) {
        const balance = Math.round(wallet.balance * 100);
        if (!Number.isSafeInteger(balance) || !Number.isSafeInteger(wagerCents) || wagerCents < 0 ||
            wagerCents > balance || !Number.isSafeInteger(payoutCents) || payoutCents < 0 ||
            !Number.isSafeInteger(balance - wagerCents + payoutCents) ||
            !Number.isFinite(delayMs) || delayMs < 0 || !Number.isFinite(now + delayMs)) {
            throw new Error('Invalid gambling payout.');
        }
        wallet.balance = (balance - wagerCents) / 100;
        const ticket = { wallet, payoutCents, dueAt: now + delayMs, settled: false };
        this.pending.add(ticket);
        this.update(now);
        return ticket;
    }
    update(now = performance.now()) {
        for (const ticket of this.pending) {
            if (now < ticket.dueAt) continue;
            const total = Math.round(ticket.wallet.balance * 100) + ticket.payoutCents;
            if (!Number.isSafeInteger(total)) throw new Error('Gambling payout exceeds the supported balance.');
            ticket.wallet.balance = total / 100;
            ticket.settled = true;
            this.pending.delete(ticket);
        }
    }
}
