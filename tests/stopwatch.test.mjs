import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const cache = new Map();
function moduleURL(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    const source = fs.readFileSync(file, 'utf8').replace(/from (['"])(\.{1,2}\/[^'"]+)\1/g,
        (_, quote, dependency) => `from ${JSON.stringify(moduleURL(path.resolve(path.dirname(file), dependency)))}`);
    const result = 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
    cache.set(file, result);
    return result;
}
const {getStopwatchQuote: quote, parseStopwatchTarget: parse, evaluateStopwatchStop: stop, stopwatchConfig} = await import(moduleURL('games/stopwatch.js'));
for (const [mode, config] of Object.entries(stopwatchConfig.modes)) {
    for (let gameSeed = 0; gameSeed < 100; gameSeed++) {
        const q = quote('3.5', {mode, gameSeed});
        assert.ok(q.multiplier >= config.minMultiplier && q.multiplier <= config.maxMultiplier);
        assert.deepEqual(q, quote('3.500', {mode, gameSeed}));
        assert.ok(stop(3500 / config.speed, q).won);
        assert.ok(!stop(4000 / config.speed, q).won);
    }
}
assert.equal(quote('3.5').mode, 'oneDecimal');
assert.equal(quote('3.15').mode, 'twoDecimals');
assert.equal(quote('2.394').mode, 'threeDecimals');
assert.throws(() => quote('3.15', {mode:'oneDecimal'}));
assert.throws(() => quote('3.155', {mode:'twoDecimalsFast'}));
assert.throws(() => quote('3.5', {mode:'invalid'}));
const forgiving = quote('2.394', {mode:'threeDecimalsForgiving'});
for (const elapsed of [2389,2394,2399]) assert.ok(stop(elapsed,forgiving).won);
for (const elapsed of [2388.99,2399.01]) assert.equal(stop(elapsed,forgiving).won,false);
const exact = quote('2.394', {mode:'threeDecimals'});
assert.ok(stop(2394,exact).won);
assert.equal(stop(2395,exact).won,false);
const fast = quote('3.15', {mode:'twoDecimalsFast'});
assert.ok(stop(2100,fast).won);
assert.equal(stop(3150,fast).won,false);
for(let gameSeed=0;gameSeed<100;gameSeed++) {
 assert.ok(quote('0.555',{mode:'threeDecimals',gameSeed}).multiplier < quote('2.394',{mode:'threeDecimals',gameSeed}).multiplier);
 assert.ok(quote('3.15',{mode:'twoDecimals',gameSeed}).multiplier < quote('1.91',{mode:'twoDecimals',gameSeed}).multiplier);
}
for (const value of ['',0,-1,'1.2345',Infinity,NaN,null]) assert.throws(() => parse(value));
assert.equal(stop(NaN,exact).won,false);
console.log('Passed five multiplier ranges, seeded stability, simplicity ordering, mode precision, 1.5× speed, and ±5ms boundaries.');
