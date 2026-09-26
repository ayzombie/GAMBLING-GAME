import { resourcePrices, minerUpgrades } from './gameData.js';

export function validateTier(tier) {
    if (!Number.isFinite(tier.cycleSeconds) || tier.cycleSeconds <= 0) {
        throw new Error(`${tier.name}: cycleSeconds must be greater than zero.`);
    }
    if (!Number.isSafeInteger(tier.resourcesPerCycle) || tier.resourcesPerCycle < 1) {
        throw new Error(`${tier.name}: resourcesPerCycle must be a positive integer.`);
    }
    if (!Array.isArray(tier.drops) || !tier.drops.length || tier.drops.some(drop =>
        !Object.hasOwn(resourcePrices, drop.type) || !Number.isFinite(drop.weight) || drop.weight < 0)) {
        throw new Error(`${tier.name}: drops need valid material types and nonnegative weights.`);
    }
    const total = tier.drops.reduce((sum, drop) => sum + drop.weight, 0);
    if (!Number.isFinite(total) || total <= 0) throw new Error(`${tier.name}: drop weights must have a positive, finite total.`);
}

export default class Miner {
    constructor(tier, output = { storage: {}, produced: {} }) {
        validateTier(tier);
        this.tier = tier;
        this.elapsed = 0;
        this.output = output;
        this.cycleLevel = 1;
        this.resourceLevel = 1;
    }

    get storage() { return this.output.storage; }
    set storage(value) { this.output.storage = value; }
    get produced() { return this.output.produced; }

    get cycleSeconds() {
        return this.tier.cycleSeconds * minerUpgrades.cycleMultiplierPerLevel ** (this.cycleLevel - 1);
    }

    get resourcesPerCycle() {
        return this.tier.resourcesPerCycle + (this.resourceLevel - 1) * minerUpgrades.extraResourcesPerLevel;
    }

    upgradeCycle() {
        if (this.cycleLevel >= minerUpgrades.maxLevel) return false;
        const progress = this.progress;
        this.cycleLevel++;
        this.elapsed = progress * this.cycleSeconds;
        return true;
    }

    upgradeCost(track) {
        if (!['cycle', 'resources'].includes(track)) throw new Error('Unknown upgrade track');
        const level = track === 'cycle' ? this.cycleLevel : this.resourceLevel;
        if (level >= minerUpgrades.maxLevel) return null;
        const base = track === 'cycle' ? minerUpgrades.cycleBaseCost : minerUpgrades.resourceBaseCost;
        // Keep the accumulated price at level 20, then grow at the second rate.
        const earlyLevels = Math.min(level - 1, 19);
        const laterLevels = Math.max(0, level - 20);
        return Math.ceil(base * minerUpgrades.costMultiplierPerLevel ** earlyLevels *
            minerUpgrades.costMultiplierPerLevel2 ** laterLevels);
    }

    buyUpgrade(track, wallet) {
        const cost = this.upgradeCost(track);
        if (cost === null || !Number.isFinite(cost) || cost < 0 || !Number.isFinite(wallet.balance) || wallet.balance < cost) return false;
        const upgraded = track === 'cycle' ? this.upgradeCycle() : this.upgradeResources();
        if (!upgraded) return false;
        wallet.balance -= cost;
        return true;
    }

    upgradeResources() {
        if (this.resourceLevel >= minerUpgrades.maxLevel) return false;
        this.resourceLevel++;
        return true;
    }

    update(deltaSeconds) {
        if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) return;
        this.elapsed += deltaSeconds;

        while (this.elapsed >= this.cycleSeconds) {
            this.elapsed -= this.cycleSeconds;
            this.mine();
        }
    }

    mine() {
        const quantity = 1 + Math.floor(Math.random() * this.resourcesPerCycle);
        for (let i = 0; i < quantity; i++) {
            const type = this.chooseDrop();
            this.storage[type] = (this.storage[type] ?? 0) + 1;
            this.produced[type] = (this.produced[type] ?? 0) + 1;
        }
    }

    chooseDrop() {
        const drops = this.tier.drops;
        const total = drops.reduce(
            (sum, drop) => sum + drop.weight, 0
        );

        let roll = Math.random() * total;

        for (const drop of drops) {
            roll -= drop.weight;
            if (roll < 0) return drop.type;
        }

        return drops[drops.length - 1].type;
    }

    get progress() {
        return this.elapsed / this.cycleSeconds;
    }
}
