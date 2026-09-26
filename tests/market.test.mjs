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

const {createMarketPrices} = await import(moduleURL('marketPrices.js'));
const {resourcePrices, baseResourcePrices, gameState} = await import(moduleURL('gameData.js'));
const {default: Inventory} = await import(moduleURL('inventory.js'));
const {sellMaterial, countMaterial} = await import(moduleURL('market.js'));
const {items} = await import(moduleURL('items.js'));
const {default: World, MAP_LENGTH, SPAWN} = await import(moduleURL('world.js'));
for(let seed=0;seed<100;seed++) {
 const prices=createMarketPrices(baseResourcePrices,seed);
 assert.deepEqual(prices,createMarketPrices(baseResourcePrices,seed));
 for(const [type,price] of Object.entries(prices)) assert.ok(price>=baseResourcePrices[type]*0.95-0.005 && price<=baseResourcePrices[type]*1.05+0.005);
}
const inventory=new Inventory();inventory.add('Gold',70);
const before=gameState.balance;
assert.ok(sellMaterial(inventory,'Gold',65));
assert.equal(countMaterial(inventory,'Gold'),5);
assert.equal(Math.round(gameState.balance*100),Math.round(before*100)+Math.round(resourcePrices.Gold*100)*65);
assert.equal(sellMaterial(inventory,'Gold',6),false);
assert.equal(sellMaterial(inventory,'Gold',-1),false);
assert.ok(sellMaterial(inventory,'Gold',5));assert.equal(countMaterial(inventory,'Gold'),0);
assert.equal(sellMaterial(inventory,'Gold',1),false);
const oldPrice=resourcePrices.Gold;resourcePrices.Gold=123;assert.equal(items.Gold.value,123);resourcePrices.Gold=oldPrice;
const world=new World();assert.equal(world.market.x+world.market.size/2,MAP_LENGTH/2);
const player={...SPAWN};world.movePlayer(player,0,-1000);assert.ok(world.market.canInteract(player));assert.equal(world.market.blocksPlayer(player.x,player.y),false);
console.log('Passed startup fluctuation, seed repeatability, sale accounting, insufficient quantities, live prices and market access.');

const {MarketSimulation} = await import(moduleURL('marketSimulation.js'));
const {marketConfig} = await import(moduleURL('gameData.js'));
function simulation() {
 const prices={Stone:10,Gold:600},history={};
 const sim=new MarketSimulation(prices,history,480,123,marketConfig);
 return {prices,history,sim};
}
const one=simulation(),two=simulation();
one.sim.update(50480);
for(let minute=481;minute<=50480;minute++)two.sim.update(minute);
assert.deepEqual(one.history,two.history,'Frame rate does not change history');
for(const [type,history] of Object.entries(one.history)) {
 assert.ok(history.length>700);
 for(let i=1;i<history.length;i++) {
  const interval=history[i].minute-history[i-1].minute;
  assert.ok(interval>=50&&interval<=70);
  assert.ok(history[i].price>=0.01&&Number.isFinite(history[i].price));
 }
 assert.equal(one.prices[type],history.at(-1).price);
}
for(const [direction,expected] of [[0.1,15],[0.9,185]]) {
 const prices={Stone:100},history={};
 const sim=new MarketSimulation(prices,history,0,1,{...marketConfig,extremeMinPercent:0.85,extremeMaxPercent:0.85});
 const draws=[0.999,direction,0.5,0.5];sim.random=()=>draws.shift() ?? 0.5;
 sim.update(sim.nextUpdate.Stone);
 assert.notEqual(prices.Stone,expected,'Movement must not finish in one step');
 while(sim.movements.Stone.index<sim.movements.Stone.prices.length)sim.update(sim.nextUpdate.Stone);
 assert.equal(prices.Stone,expected,'Equally sized extreme rises and falls');
}
const fresh=simulation();fresh.sim.update(529);
assert.equal(fresh.history.Stone.length,1,'No premature snapshot');
console.log('Passed seeded history, 50–70 minute scheduling, frame-rate independence, positivity, and symmetric extreme moves.');

const {historyStats,priceChange,pickChartSnapshot}=await import(moduleURL('marketStats.js'));
assert.deepEqual(historyStats([{price:100},{price:150},{price:80},{price:120}]),{high:150,low:80,difference:20,percentage:20});
assert.deepEqual(priceChange(80,100),{difference:-20,percentage:-20});
assert.deepEqual(historyStats([{price:10}]),{high:10,low:10,difference:0,percentage:0});
const points=[{x:100,y:100,index:4},{x:200,y:200,index:5}];
assert.equal(pickChartSnapshot(points,{x:100,y:100}),4);
assert.equal(pickChartSnapshot(points,{x:150,y:150}),5);
assert.equal(pickChartSnapshot(points,{x:150,y:50}),null);
assert.equal(pickChartSnapshot(points.map(p=>({...p,x:p.x-50})),{x:50,y:100}),4);
console.log('Passed full-history stats, signed changes, single snapshots, line/point hover, and scrolled coordinates.');

const {validateMarketConfig} = await import(moduleURL('marketSimulation.js'));
assert.throws(()=>validateMarketConfig({...marketConfig,mediumChance:0.5}));
assert.throws(()=>validateMarketConfig({...marketConfig,mediumMaxDollars:-1}));
for(const [event,cap] of [[0,marketConfig.smallMaxDollars],[marketConfig.smallChance+marketConfig.mediumChance/2,marketConfig.mediumMaxDollars],[0.999,marketConfig.extremeMaxDollars]]) {
 const prices={Gold:100000},history={};
 const sim=new MarketSimulation(prices,history,0,1,marketConfig);
 const draws=[event,0.9,1,0.5];sim.random=()=>draws.shift() ?? 0.5;sim.update(sim.nextUpdate.Gold);
 while(sim.movements.Gold.index<sim.movements.Gold.prices.length)sim.update(sim.nextUpdate.Gold);
 assert.equal(prices.Gold,100000+cap);
}
console.log('Passed chance validation and small, medium, and extreme dollar caps.');

let reversals=0, excursions=0, smallSingles=0, largeSingles=0;
for(let seed=0;seed<200;seed++) {
 const prices={Gold:1000},history={};
 const sim=new MarketSimulation(prices,history,0,seed,{...marketConfig,smallChance:0,mediumChance:0,extremeChance:1});
 sim.update(sim.nextUpdate.Gold);
 const movement=sim.movements.Gold;
 assert.ok(movement.prices.length>=1&&movement.prices.length<=5);
 assert.equal(movement.prices.at(-1),movement.target);
 const low=Math.min(movement.start,movement.target),high=Math.max(movement.start,movement.target);
 assert.ok(movement.prices.every(price=>Number.isFinite(price)&&price>=marketConfig.minimumPrice));
 if(movement.prices.some(price=>price<low||price>high))excursions++;
 for(const [change,isSmall] of [[0.2,true],[0.4,false]]) {
  const trial=new MarketSimulation({Gold:500},{},0,seed,{...marketConfig,smallChance:0,mediumChance:1,extremeChance:0,mediumMinPercent:change,mediumMaxPercent:change});
  if(trial.createMovement('Gold').prices.length===1) {
   if(isSmall)smallSingles++;else largeSingles++;
  }
 }
 const direction=Math.sign(movement.target-movement.start);
 for(let i=1;i<movement.prices.length;i++)if((movement.prices[i]-movement.prices[i-1])*direction<0)reversals++;
}
assert.ok(reversals>0,'Paths can briefly reverse direction');
assert.throws(()=>validateMarketConfig({...marketConfig,minMoveUpdates:0}));
assert.ok(excursions>0,'Prices can move outside the start/target range');
assert.ok(smallSingles>100,'20% changes usually complete in one step');
assert.ok(largeSingles<100&&largeSingles>0,'40% changes usually take multiple steps, but can take one');
assert.ok(smallSingles>largeSingles,'Smaller changes favor fewer steps');
console.log('Passed 1–5 step movements, magnitude-based single steps, final targets, positive prices, overshoots, and reversals.');
