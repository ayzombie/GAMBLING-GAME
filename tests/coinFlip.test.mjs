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



const {default: CoinFlip, coinFlipOptions, validateCoinBet} = await import(moduleURL('coinFlip.js'));
const expectedMultipliers = {
    1: [1.5, 1.5], 2: [3, 1.5, 3], 3: [6, 2, 2, 6],
    4: [20, 5, 5, 4, 18], 5: [50, 2, 2, 50],
};
for (let count=1;count<=5;count++) {
    assert.deepEqual(coinFlipOptions[count].map(option=>option.multiplier), expectedMultipliers[count]);
    for (const option of coinFlipOptions[count]) {
        let winners=0;
        for(let outcome=0;outcome<2**count;outcome++) {
            const game=new CoinFlip(5),wallet={balance:1000};
            const faces=Array.from({length:count},(_,i)=>outcome&(1<<i)?'heads':'tails');
            let index=0;game.random=()=>faces[index++]==='heads'?.1:.9;
            const result=game.play(wallet,count,option.id,25);
            assert.equal(result.ok,true);assert.deepEqual(result.round.coins,faces);
            const heads=faces.filter(face=>face==='heads').length;
            const expectedWin=option.id==='more-heads'?heads>count-heads:option.id==='more-tails'?heads<count-heads:
                option.id==='heads'?heads===count:option.id==='tails'?heads===0:heads===count/2;
            assert.equal(result.round.won,expectedWin,`${count} ${option.id} ${faces}`);
            const payout=expectedWin?25*option.multiplier:0;
            assert.equal(result.round.payout,payout);assert.equal(wallet.balance,1000-25+payout);
            if(expectedWin)winners++;
        }
        if(option.majority) assert.equal(winners,count===4?5:2**(count-1));
        else if(option.id==='split')assert.equal(winners,count===2?2:6);
        else assert.equal(winners,1);
    }
}
const game=new CoinFlip(123),wallet={balance:100};
for (const bet of [NaN,Infinity,-10,0,24.99,100.01,25.001,'25']) {
    const state=game.state;
    assert.equal(game.play(wallet,1,'heads',bet).ok,false);
    assert.equal(wallet.balance,100);assert.equal(game.state,state);assert.equal(game.rounds,0);
}
for(const [count,option] of [[0,'heads'],[6,'heads'],[2.5,'heads'],[2,'more-heads'],[1,'bad']]) {
    assert.equal(game.play(wallet,count,option,25).ok,false);assert.equal(wallet.balance,100);
}
assert.ok(validateCoinBet({balance:1e15},5,'heads',1e15));
game.random=()=>.1;
assert.equal(game.play(wallet,1,'heads',25.01).round.payout,37.52);
assert.equal(wallet.balance,112.51);
const loss=new CoinFlip(7),poor={balance:25};loss.random=()=>.9;
assert.equal(loss.play(poor,1,'heads',25).ok,true);assert.equal(poor.balance,0);
assert.equal(loss.play(poor,1,'heads',25).ok,false);
const a=new CoinFlip('seed'),b=new CoinFlip('seed'),wa={balance:100000},wb={balance:100000};
for(let i=0;i<30;i++)assert.deepEqual(a.play(wa,5,'heads',25),b.play(wb,5,'heads',25));
assert.deepEqual(wa,wb);
const {default: CasinoInterior}=await import(moduleURL('casinoInterior.js'));
const room=new CasinoInterior(1800,1800);
assert.equal(room.canPlayCoinFlip(room.spawn),false);
assert.equal(room.canPlayCoinFlip({x:340,y:990}),true);
assert.equal(room.blocked(340,990),false);
await import(moduleURL('coinFlipGui.js'));
console.log('Passed every coin outcome, exact payouts, strict majorities/ties, cents, invalid bets, insufficient funds, seeded rounds, and table access.');

const {default: GamblingPayouts} = await import(moduleURL('gamblingPayouts.js'));
const payouts = new GamblingPayouts();
const animated = new CoinFlip('animated', () => true, payouts);
animated.random = () => 0.1;
const allIn = {balance: 100};
assert.equal(animated.play(allIn, 1, 'heads', 100, 1100, 0).ok, true);
assert.equal(allIn.balance, 0, 'Wager is deducted when the flip starts');
assert.equal(payouts.hasPending, true, 'Pending result must prevent premature game over');
assert.equal(animated.play(allIn, 1, 'heads', 25, 1100, 1).ok, false);
payouts.update(1099); assert.equal(allIn.balance, 0);
payouts.update(1100); assert.equal(allIn.balance, 150, 'Payout arrives without another bet or GUI action');
assert.equal(payouts.hasPending, false);
payouts.update(2200); assert.equal(allIn.balance, 150, 'Never pay the same result twice');
animated.play(allIn, 1, 'heads', 25, 1100, 3000);
allIn.balance += 10;
payouts.update(5000);
assert.equal(allIn.balance, 172.5, 'Menu-independent settlement preserves other balance changes');
animated.random = () => 0.9;
animated.play(allIn, 1, 'heads', 25, 1100, 6000);
payouts.update(7100);
assert.equal(allIn.balance, 147.5); assert.equal(payouts.hasPending, false);
console.log('Passed automatic result-time payout, pending-round protection, exactly-once credit, closed-menu settlement, and losing-round completion.');
