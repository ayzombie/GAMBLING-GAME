// Stable per-material starting prices; independent of draw order and other RNG use.
export function createMarketPrices(basePrices, seed) {
    return Object.fromEntries(Object.entries(basePrices).map(([type, base]) => {
        if (!Number.isFinite(base) || base <= 0) throw new Error(`Invalid base price: ${type}`);
        let hash = 2166136261;
        for (const char of `${seed}:market:${type}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
        hash ^= hash >>> 16;
        hash = Math.imul(hash, 0x7feb352d);
        hash ^= hash >>> 15;
        const factor = 0.95 + (hash >>> 0) / 4294967296 * 0.10;
        return [type, Math.round(base * factor * 100) / 100];
    }));
}
