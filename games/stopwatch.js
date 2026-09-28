import { seed } from '../gameSeed.js';

export const stopwatchConfig = {
    modes: {
        oneDecimal: { label: '1 decimal', decimals: 1, speed: 1, toleranceMs: 0, minMultiplier: 1.1, maxMultiplier: 4 },
        twoDecimals: { label: '2 decimals', decimals: 2, speed: 1, toleranceMs: 0, minMultiplier: 25, maxMultiplier: 75 },
        twoDecimalsFast: { label: '2 decimals · 1.5× speed', decimals: 2, speed: 1.5, toleranceMs: 0, minMultiplier: 175, maxMultiplier: 250 },
        threeDecimalsForgiving: { label: '3 decimals · ±5ms', decimals: 3, speed: 1, toleranceMs: 5, minMultiplier: 550, maxMultiplier: 900 },
        threeDecimals: { label: '3 decimals · exact', decimals: 3, speed: 1, toleranceMs: 0, minMultiplier: 3000, maxMultiplier: 6000 },
    },
};

export function parseStopwatchTarget(target) {
    if (typeof target !== 'string' && typeof target !== 'number') throw new Error('Enter a positive number with up to 3 decimal digits.');
    const text = String(target).trim();
    if (!/^(?:\d+)(?:\.\d{1,3})?$/.test(text)) throw new Error('Enter a positive number with up to 3 decimal digits.');
    const [whole, fraction = ''] = text.split('.');
    const milliseconds = Number(whole) * 1000 + Number(fraction.padEnd(3, '0'));
    if (!Number.isSafeInteger(milliseconds) || milliseconds <= 0) throw new Error('Target must be positive and within the supported range.');
    return milliseconds;
}

function seededTargetRandom(gameSeed, key) {
    if ((typeof gameSeed !== 'number' && typeof gameSeed !== 'string') ||
        (typeof gameSeed === 'number' && !Number.isFinite(gameSeed))) throw new Error('Invalid game seed.');
    const text = `${gameSeed}:stopwatch:v2:${key}`;
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 0x7feb352d);
    hash ^= hash >>> 15;
    hash = Math.imul(hash, 0x846ca68b);
    hash ^= hash >>> 16;
    return (hash >>> 0) / 4294967296;
}

function inferredMode(milliseconds) {
    return milliseconds % 100 === 0 ? 'oneDecimal' : milliseconds % 10 === 0 ? 'twoDecimals' : 'threeDecimals';
}

// Simplicity is a reward heuristic within a mode, not a claim about win odds.
export function getStopwatchDifficulty(target) {
    const milliseconds = parseStopwatchTarget(target);
    const fraction = String(milliseconds % 1000).padStart(3, '0').replace(/0+$/, '');
    if (!fraction.length || fraction === '5') return 0;
    if (/^(\d)\1+$/.test(fraction)) return 0.15;
    if (fraction.length === 1) return 0.35;
    if (fraction.length === 2 && Number(fraction) % 5 === 0) return 0.3;
    return 1;
}

export function getStopwatchQuote(target, { mode, gameSeed = seed } = {}) {
    const targetMilliseconds = parseStopwatchTarget(target);
    const modeId = mode ?? inferredMode(targetMilliseconds);
    if (!Object.hasOwn(stopwatchConfig.modes, modeId)) throw new Error('Unknown stopwatch mode.');
    const settings = stopwatchConfig.modes[modeId];
    const resolutionMs = 10 ** (3 - settings.decimals);
    if (targetMilliseconds % resolutionMs !== 0) {
        throw new Error(`This mode supports at most ${settings.decimals} decimal places.`);
    }
    const difficulty = getStopwatchDifficulty(target);
    const random = seededTargetRandom(gameSeed, `${modeId}:${targetMilliseconds}`);
    const position = difficulty * 0.7 + random * 0.3;
    const multiplier = Math.round((settings.minMultiplier + position * (settings.maxMultiplier - settings.minMultiplier)) * 100) / 100;
    return Object.freeze({
        mode: modeId,
        targetMilliseconds,
        targetSeconds: targetMilliseconds / 1000,
        decimals: settings.decimals,
        speed: settings.speed,
        toleranceMs: settings.toleranceMs,
        resolutionMs,
        multiplier,
    });
}

export function getStopwatchMultiplier(target, options) {
    return getStopwatchQuote(target, options).multiplier;
}

// Pass real elapsed time measured with performance.now(). Speed is applied here once.
// Keep the quote created before accepting the bet; do not recompute it at Stop.
export function evaluateStopwatchStop(realElapsedMs, quote) {
    if (!Number.isFinite(realElapsedMs) || realElapsedMs < 0) {
        return { won: false, clockMilliseconds: null, displayedMilliseconds: null };
    }
    const clockMilliseconds = realElapsedMs * quote.speed;
    const displayedMilliseconds = Math.round(clockMilliseconds / quote.resolutionMs) * quote.resolutionMs;
    const won = quote.toleranceMs > 0
        ? Math.abs(clockMilliseconds - quote.targetMilliseconds) <= quote.toleranceMs
        : displayedMilliseconds === quote.targetMilliseconds;
    return { won, clockMilliseconds, displayedMilliseconds };
}

export function isExactStop(realElapsedMs, target, options) {
    return evaluateStopwatchStop(realElapsedMs, getStopwatchQuote(target, options)).won;
}

export function getSeed() { return seed; }

// Quick console test; omitted mode is inferred from the target's precision.
export function testStopwatch(decimal, mode) {
    const quote = getStopwatchQuote(decimal, { mode });
    console.table([{
        target: quote.targetSeconds.toFixed(quote.decimals),
        mode: quote.mode,
        speed: `${quote.speed}x`,
        tolerance: quote.toleranceMs ? `±${quote.toleranceMs}ms` : 'Match displayed precision',
        multiplier: `${quote.multiplier}x`,
    }]);
    return quote;
}
