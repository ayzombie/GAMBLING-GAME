import GamblingPayouts from './gamblingPayouts.js';

export const MINIMUM_COIN_BET = 25;

// Multipliers are total returns, including the original wager.
// Majority bets require both faces: unanimous results and ties do not qualify.
export const coinFlipOptions = {
    1: [
        { id: 'heads', label: 'Heads', multiplier: 1.5, heads: 1 },
        { id: 'tails', label: 'Tails', multiplier: 1.5, heads: 0 },
    ],
    2: [
        { id: 'heads', label: '2 heads', multiplier: 2, heads: 2 },
        { id: 'split', label: '1 head, 1 tail', multiplier: 1.5, heads: 1 },
        { id: 'tails', label: '2 tails', multiplier: 2, heads: 0 },
    ],
    3: [
        { id: 'heads', label: '3 heads', multiplier: 5, heads: 3 },
        { id: 'more-heads', label: 'More heads than tails', multiplier: 2, majority: 'heads' },
        { id: 'more-tails', label: 'More tails than heads', multiplier: 2, majority: 'tails' },
        { id: 'tails', label: '3 tails', multiplier: 5, heads: 0 },
    ],
    4: [
        { id: 'heads', label: '4 heads', multiplier: 15, heads: 4 },
        { id: 'more-heads', label: 'More heads than tails', multiplier: 3, majority: 'heads' },
        { id: 'more-tails', label: 'More tails than heads', multiplier: 3, majority: 'tails' },
        { id: 'split', label: '2 heads, 2 tails', multiplier: 2, heads: 2 },
        { id: 'tails', label: '4 tails', multiplier: 15, heads: 0 },
    ],
    5: [
        { id: 'heads', label: '5 heads', multiplier: 25, heads: 5 },
        { id: 'more-heads', label: 'More heads than tails', multiplier: 2, majority: 'heads' },
        { id: 'more-tails', label: 'More tails than heads', multiplier: 2, majority: 'tails' },
        { id: 'tails', label: '5 tails', multiplier: 25, heads: 0 },
    ],
};

export function moneyToCents(value) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
    const cents = Math.round(value * 100);
    return Number.isSafeInteger(cents) && Math.abs(value * 100 - cents) < 0.000001 ? cents : null;
}

export function validateCoinBet(wallet, count, optionId, wager) {
    if (!Number.isInteger(count) || !Object.hasOwn(coinFlipOptions, count)) return 'Choose 1–5 coins.';
    const option = coinFlipOptions[count].find(option => option.id === optionId);
    if (!option) return 'Choose an outcome first.';
    const cents = moneyToCents(wager), balance = moneyToCents(wallet.balance);
    if (cents === null) return 'Enter a valid wager with no more than two decimal places.';
    if (cents < MINIMUM_COIN_BET * 100) return 'Minimum bet is $25.';
    if (balance === null || cents > balance) return 'Not enough money for this bet.';
    const payout = Math.round(cents * option.multiplier);
    if (!Number.isSafeInteger(payout) || !Number.isSafeInteger(balance - cents + payout)) return 'This wager is too large.';
    return null;
}

export default class CoinFlip {
    constructor(seed, canPlay = () => true, payouts = new GamblingPayouts()) {
        this.payouts = payouts;
        this.pendingPayout = null;
        this.canPlay = canPlay;
        this.state = 2166136261;
        for (const char of `${seed}:coin-flip`) this.state = Math.imul(this.state ^ char.charCodeAt(0), 16777619) >>> 0;
        this.lastRound = null;
        this.rounds = 0;
    }
    random() {
        this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
        return this.state / 4294967296;
    }
    play(wallet, count, optionId, wager, delayMs = 0, now = performance.now()) {
        if (this.pendingPayout && !this.pendingPayout.settled) return { ok: false, error: 'Wait for the current flip to finish.' };
        if (!this.canPlay()) return { ok: false, error: 'Buy the apartment for $900 before gambling.' };
        const error = validateCoinBet(wallet, count, optionId, wager);
        if (error) return { ok: false, error };
        const option = coinFlipOptions[count].find(option => option.id === optionId);
        const coins = Array.from({ length: count }, () => this.random() < 0.5 ? 'heads' : 'tails');
        const heads = coins.filter(face => face === 'heads').length;
        const won = option.majority === 'heads' ? heads > count / 2 && heads < count :
            option.majority === 'tails' ? heads < count / 2 && heads > 0 : heads === option.heads;
        const stake = moneyToCents(wager);
        const payout = won ? Math.round(stake * option.multiplier) : 0;
        this.pendingPayout = this.payouts.schedule(wallet, stake, payout, delayMs, now);
        this.lastRound = {
            id: ++this.rounds, count, optionId, label: option.label, coins, heads, tails: count - heads,
            won, wager: stake / 100, payout: payout / 100, net: (payout - stake) / 100,
            multiplier: option.multiplier,
        };
        return { ok: true, round: this.lastRound };
    }
}
