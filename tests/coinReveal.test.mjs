import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const cache = new Map();
function moduleURL(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    const source = fs.readFileSync(file, 'utf8').replace(/from (['"])(\.\/[^'"]+)\1/g,
        (_, quote, dependency) => `from ${JSON.stringify(moduleURL(path.resolve(path.dirname(file), dependency)))}`);
    const result = 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
    cache.set(file, result);
    return result;
}




const {default: CoinReveal, coinRevealTiming, sampleCoinMotion} = await import(moduleURL('coinReveal.js'));
for (const [count, perCoin] of [[1,3000],[2,3000],[3,2000],[4,1200],[5,1200]]) {
    assert.deepEqual(coinRevealTiming(count), {perCoin,total:perCoin*count});
    for (const face of ['heads','tails']) {
        for(let t=0;t<=perCoin;t+=10) {
            const motion=sampleCoinMotion(t,perCoin,face);
            assert.ok(motion.height>=0&&motion.height<=1.00001);
            assert.ok(Number.isFinite(motion.rotation));
        }
        const end=sampleCoinMotion(perCoin,perCoin,face);
        assert.equal(end.height,0);assert.equal(end.landed,true);
        assert.equal(end.rotation%360,face==='heads'?0:180);
    }
}
function node(){return {children:[],style:{setProperty(){}},dataset:{},classList:{toggle(){}},setAttribute(){},append(...children){this.children.push(...children);},replaceChildren(){this.children=[];},addEventListener(){}};}
globalThis.document={createElement:node};
globalThis.window={matchMedia:()=>({matches:false})};
const reveal=new CoinReveal(node(),{count:3,coins:['heads','tails','heads'],label:'More heads',multiplier:2,wager:25,heads:2,tails:1,won:true,payout:50,net:25},100,()=>{});
reveal.update(100);assert.equal(reveal.models[0].slot.style.visibility,'visible');assert.equal(reveal.models[1].slot.style.visibility,'hidden');
reveal.update(2099);assert.equal(reveal.counter.textContent,'COIN 1 OF 3');assert.equal(reveal.chips[0].textContent,'1');
reveal.update(2100);assert.equal(reveal.counter.textContent,'COIN 2 OF 3');assert.equal(reveal.chips[0].textContent,'H');assert.equal(reveal.chips[1].textContent,'2');
assert.equal(reveal.models[0].slot.style.visibility,'visible');assert.equal(reveal.models[1].slot.style.visibility,'visible');assert.equal(reveal.models[2].slot.style.visibility,'hidden');
const landedPose=reveal.models[0].coin.style.transform;
reveal.update(4100);assert.equal(reveal.models[0].coin.style.transform,landedPose);assert.ok(reveal.models.every(model=>model.slot.style.visibility==='visible'));
assert.equal(reveal.counter.textContent,'COIN 3 OF 3');assert.equal(reveal.chips[1].textContent,'T');
assert.equal(reveal.update(6099),false);assert.equal(reveal.update(6100),true);
assert.equal(reveal.counter.textContent,'RESULT');assert.equal(reveal.back.hidden,false);
const {default: CoinFlip}=await import(moduleURL('coinFlip.js'));
const {default: GamblingPayouts}=await import(moduleURL('gamblingPayouts.js'));
const payouts=new GamblingPayouts(),game=new CoinFlip(1,()=>true,payouts),wallet={balance:100};game.random=()=>.1;
const total=coinRevealTiming(5).total;
game.play(wallet,5,'heads',25,total,0);assert.equal(wallet.balance,75);
payouts.update(total-1);assert.equal(wallet.balance,75);
payouts.update(total);assert.equal(wallet.balance,700);
console.log('Passed sequential reveal timing, gravity/bounces, final faces, no early results, and payout after the final coin.');
