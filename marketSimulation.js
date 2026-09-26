export function validateMarketConfig(config) {
    if (!Number.isSafeInteger(config.minMoveUpdates) || !Number.isSafeInteger(config.maxMoveUpdates) ||
        config.minMoveUpdates < 1 || config.maxMoveUpdates < config.minMoveUpdates) {
        throw new Error('Market movement lengths must be integers, with 1 <= minMoveUpdates <= maxMoveUpdates.');
    }
    if (!Number.isFinite(config.singleStepScale) || config.singleStepScale <= 0 ||
        !Number.isFinite(config.movementNoise) || config.movementNoise < 0) {
        throw new Error('Market singleStepScale must be positive and movementNoise nonnegative.');
    }
    const chances = [config.smallChance, config.mediumChance, config.extremeChance];
    if (chances.some(chance => !Number.isFinite(chance) || chance < 0 || chance > 1) ||
        Math.abs(chances.reduce((sum, chance) => sum + chance, 0) - 1) > 1e-9) {
        throw new Error('Market smallChance, mediumChance and extremeChance must total 1.');
    }
    for (const key of ['smallMaxDollars', 'mediumMaxDollars', 'extremeMaxDollars']) {
        if (!Number.isFinite(config[key]) || config[key] < 0) throw new Error(`${key} must be nonnegative.`);
    }
    for (const [min, max] of [[0, config.smallMaxPercent], [config.mediumMinPercent, config.mediumMaxPercent], [config.extremeMinPercent, config.extremeMaxPercent]]) {
        if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) throw new Error('Invalid market percentage range.');
    }
    if (!Number.isFinite(config.minimumPrice) || config.minimumPrice < 0.01 ||
        !Number.isFinite(config.minIntervalMinutes) || config.minIntervalMinutes <= 0 ||
        !Number.isFinite(config.maxIntervalMinutes) || config.maxIntervalMinutes < config.minIntervalMinutes) {
        throw new Error('Market requires a positive update interval and minimumPrice of at least $0.01.');
    }
}

export class MarketSimulation {
    constructor(prices, history, startMinute, seed, config) {
        validateMarketConfig(config);
        this.prices = prices;
        this.history = history;
        this.config = config;
        this.streams = {};
        this.nextUpdate = {};
        this.movements = {};
        this.newsHolds = {};
        for (const type of Object.keys(prices)) {
            let hash = 2166136261;
            for (const char of `${seed}:market-history:${type}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
            this.streams[type] = hash >>> 0;
            if (!history[type]?.length) history[type] = [{ minute: startMinute, price: prices[type] }];
            this.nextUpdate[type] = startMinute + this.interval(type);
        }
    }
    random(type) {
        this.streams[type] = (Math.imul(this.streams[type],1664525)+1013904223) >>> 0;
        return this.streams[type] / 4294967296;
    }
    interval(type) {
        return this.config.minIntervalMinutes + this.random(type) * (this.config.maxIntervalMinutes-this.config.minIntervalMinutes);
    }
    applyNewsImpact(type, percent, { holdId = null, basePrice = this.prices[type] } = {}) {
        if (!Object.hasOwn(this.prices, type) || !Number.isFinite(percent) || percent < -1) {
            throw new Error(`Invalid news impact for ${type}.`);
        }
        // A persistent story owns this resource until explicitly resolved.
        if (this.newsHolds[type]) return;
        const target = Math.max(this.config.minimumPrice, Math.round(basePrice * (1 + percent) * 100) / 100);
        this.movements[type] = this.createMovement(type, percent, target);
        if (holdId) this.newsHolds[type] = { id: holdId, target, basePrice: this.prices[type] };
    }
    releaseNewsHold(id) {
        const baselines = {};
        for (const [type, hold] of Object.entries(this.newsHolds)) {
            if (hold.id !== id) continue;
            baselines[type] = hold.basePrice;
            delete this.newsHolds[type];
            delete this.movements[type];
        }
        return baselines;
    }
    createMovement(type, newsPercent = null, targetPrice = null) {
        const current = this.prices[type];
        let signedChange;
        if (newsPercent !== null) {
            // News bypasses normal chance rolls and dollar/percentage change caps.
            signedChange = current * newsPercent;
        } else {
            const event = this.random(type);
            const sign = this.random(type) < 0.5 ? -1 : 1;
            const magnitude = this.random(type);
            let change;
            if (event < this.config.smallChance) {
                change = Math.min(this.config.smallMaxDollars,current*this.config.smallMaxPercent) * magnitude ** 2;
            } else if (event < this.config.smallChance + this.config.mediumChance) {
                change = Math.min(this.config.mediumMaxDollars, current*(this.config.mediumMinPercent+magnitude*(this.config.mediumMaxPercent-this.config.mediumMinPercent)));
            } else {
                change = Math.min(this.config.extremeMaxDollars, current*(this.config.extremeMinPercent+magnitude*(this.config.extremeMaxPercent-this.config.extremeMinPercent)));
            }
            signedChange = sign * change;
        }
        const target = targetPrice ?? Math.max(this.config.minimumPrice, Math.round((current + signedChange) * 100) / 100);
        const relativeChange = Math.abs(target - current) / current;
        const singleStepChance = 1 / (1 + (relativeChange / this.config.singleStepScale) ** 3);
        let count = this.config.minMoveUpdates;
        if (this.config.maxMoveUpdates > count) {
            if (count > 1 || this.random(type) >= singleStepChance) {
                const minimum = Math.max(2, count);
                count = minimum + Math.floor(this.random(type) * (this.config.maxMoveUpdates - minimum + 1));
            }
        }
        const prices = [];
        for (let step = 1; step < count; step++) {
            const progress = step / count;
            // Squared noise favors mild detours but occasionally produces deep dips or overshoots.
            // Dollar/percent caps constrain the final target, not these intermediate prices.
            const noise = this.random(type) * 2 - 1;
            const wobble = Math.sign(noise) * noise ** 2 * this.config.movementNoise * Math.sin(Math.PI * progress);
            const fraction = progress + wobble;
            prices.push(Math.max(this.config.minimumPrice,
                Math.round((current + (target - current) * fraction) * 100) / 100));
        }
        prices.push(target);
        return { start: current, target, prices, index: 0, source: newsPercent === null ? 'regular' : 'news' };
    }
    update(minute) {
        for (const type of Object.keys(this.prices)) {
            while (minute >= this.nextUpdate[type]) {
                let movement = this.movements[type];
                // Regular changes resume only after the active path (including news) finishes.
                if (!movement || movement.index >= movement.prices.length) {
                    const hold = this.newsHolds[type];
                    movement = this.movements[type] = hold
                        ? { prices: [hold.target], index: 0, target: hold.target, source: 'news-hold' }
                        : this.createMovement(type);
                }
                this.prices[type] = movement.prices[movement.index++];
                this.history[type].push({ minute: this.nextUpdate[type], price: this.prices[type] });
                this.nextUpdate[type] += this.interval(type);
            }
        }
    }
}
