import fs from 'node:fs';
import assert from 'node:assert/strict';
const {default:Crash,crashConfig}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('games/crash.js','utf8')).toString('base64'));
const wallet={balance:1000}; const game=new Crash(42,wallet);
game.random=()=>0;
game.start(100,0); assert.equal(wallet.balance,900);
assert.throws(()=>game.start(100,0));
game.update(2400);assert.equal(game.multiplier,Math.round(crashConfig.tiers[0][0]*.98*100)/100);assert.equal(wallet.balance,900);
game.cashOut(2400);assert.equal(wallet.balance,900+Math.round(100*game.multiplier));game.cashOut(2500);assert.equal(wallet.balance,900+Math.round(100*game.multiplier));
for(const queued of [false,true]){
 const w={balance:100};const g=new Crash(1,w);g.random=()=>0;g.start(100,0);
 if(queued)g.cashOut(10);
 g.update(2400);assert.equal(w.balance,queued?Math.round(100*g.multiplier):0);assert.equal(g.active,!queued);
}
const lostWallet={balance:100};const lost=new Crash(1,lostWallet);lost.random=()=>.999;lost.start(100,0);lost.cashOut(10);lost.update(2400);assert.equal(lostWallet.balance,0);assert.equal(lost.result.won,false);assert.equal(lost.active,false);
for(const value of [99,-1,NaN,Infinity,100.001,1001])assert.throws(()=>new Crash(1,{balance:1000}).start(value,0));
assert.throws(()=>new Crash(1,{balance:1000},()=>false).start(100,0));
for(let seed=0;seed<100;seed++){
 const a=new Crash(seed,{balance:1000}),b=new Crash(seed,{balance:1000});
 for(let tier=0;tier<crashConfig.tiers.length;tier++){
  a.tier=b.tier=tier;a.prepare();b.prepare();assert.deepEqual(a.next,b.next);
  const [base,chance]=crashConfig.tiers[tier],vary=chance>15?4:2;
  assert.ok(a.next.probability>=(chance-vary)/100 && a.next.probability<=(chance+vary)/100);
  assert.ok(Math.abs(a.next.multiplier-base)<=base*.02+.005);
 }
}
const top=new Crash(1,{balance:100});top.random=()=>0;top.start(100,0);
for(let i=0;i<crashConfig.tiers.length;i++){top.update((i+1)*2400);if(top.next)top.risk((i+1)*2400);}
assert.equal(top.next,null);assert.equal(top.active,true);top.cashOut(999999);assert.equal(top.active,false);assert.ok(top.result.payout>0);
console.log('Passed Crash tiers, seeded variation, stake validation, wins/losses, queued cash-out, exact-once payment and final tier.');
