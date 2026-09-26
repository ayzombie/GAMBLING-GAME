export function createSeed() {
    let seed = Date.now() % 1000000000;
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
}

export function randomizeStopwatchMultiplier(baseMultiplier) {
    const random = createSeed();

    // random modifier between 0.8x and 1.2x
    const modifier = 0.8 + random * 0.4;

    return Math.round(baseMultiplier * modifier);
}