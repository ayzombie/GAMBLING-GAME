export const crashConfig = {
    minimumBet: 100,
    spinMs: 2400,
    multiplierVariation: 0.02, // Uniform ±2% on every multiplier.
    // Chances apply to each individual spin, not to reaching the tier from the start.
    tiers: [
        [1.07,95], [1.14,85], [1.22,78], [1.38,75], [1.56,72], [1.70,70], [1.88,68],
        [2.2,65], [3.1,63], [5.9,62], [6.37,60], [7.8,57], [9.19,55], [12.18,52], [13.98,48], [15,45], [28,41],
        [58,40], [109,35], [369,30], [1950,15], [3000,15], [12000,15],
        [25000,15], [90000,10], [290000,6], [1000000,5],
    ],
};

export default class Crash {
    constructor(seed, wallet, canPlay = () => true) {
        this.wallet = wallet; this.canPlay = canPlay;
        this.state = 2166136261;
        for (const char of `${seed}:crash`) this.state = Math.imul(this.state ^ char.charCodeAt(0),16777619) >>> 0;
        this.active = false; this.spin = null; this.result = null; this.multiplier = 1;
    }
    random() { this.state = (Math.imul(this.state,1664525)+1013904223) >>> 0; return this.state / 4294967296; }
    start(wager, now = performance.now()) {
        if (this.active) throw new Error('Finish your current round first.');
        if (!this.canPlay()) throw new Error('Buy the apartment before gambling.');
        const cents = Math.round(wager*100), balance = Math.round(this.wallet.balance*100);
        if (!Number.isFinite(wager) || !Number.isSafeInteger(cents) || Math.abs(wager*100-cents)>0.000001 ||
            cents < crashConfig.minimumBet*100 || cents > balance || !Number.isSafeInteger(balance) ||
            !Number.isSafeInteger(balance + Math.round(cents * Math.max(...crashConfig.tiers.map(([base]) => base)) * (1 + crashConfig.multiplierVariation)))) throw new Error('Enter a valid wager of at least $100 within your balance.');
        this.wallet.balance = (balance-cents)/100;
        this.wagerCents = cents; this.active = true; this.result = null;
        this.multiplier = 1; this.tier = 0; this.queuedCashout = false;
        this.prepare(); this.risk(now);
    }
    prepare() {
        if (this.tier >= crashConfig.tiers.length) { this.next = null; return; }
        const [base, chance] = crashConfig.tiers[this.tier];
        const variation = chance > 15 ? 4 : 2;
        const probability = (chance + (this.random()*2-1)*variation)/100;
        const adjustment = (this.random()*2-1)*crashConfig.multiplierVariation;
        this.next = { multiplier: Math.round(base*(1+adjustment)*100)/100, probability };
    }
    risk(now = performance.now()) {
        this.update(now);
        if (!this.active || this.spin || !this.next) return;
        const landing = this.random();
        this.spin = { ...this.next, landing, won: landing < this.next.probability, startedAt: now, endsAt: now+crashConfig.spinMs };
        this.lastSpin = this.spin;
    }
    update(now = performance.now()) {
        if (!this.spin || now < this.spin.endsAt) return;
        const spin = this.spin; this.spin = null;
        if (!spin.won) {
            this.active = false; this.result = { won:false, payout:0 }; this.queuedCashout = false; return;
        }
        this.multiplier = spin.multiplier; this.tier++; this.prepare();
        if (this.queuedCashout) this.cashOut(now);
    }
    cashOut(now = performance.now()) {
        this.update(now);
        if (!this.active) return;
        // A spin already committed must resolve; cash-out requests during it queue.
        if (this.spin) { this.queuedCashout = true; return; }
        const payout = Math.round(this.wagerCents*this.multiplier);
        const balance = Math.round(this.wallet.balance*100)+payout;
        if (!Number.isSafeInteger(balance)) throw new Error('Balance exceeds the supported range.');
        this.wallet.balance = balance/100;
        this.active = false; this.queuedCashout = false;
        this.result = {won:true,payout:payout/100,multiplier:this.multiplier};
    }
}
