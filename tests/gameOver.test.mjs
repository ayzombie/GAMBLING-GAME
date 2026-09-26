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


const {default: GameOver, hasLost, gameOverStage, DEATH_MESSAGE_MS, BLACK_SCREEN_MS} = await import(moduleURL('gameOver.js'));
const {buyWorker} = await import(moduleURL('minerShop.js'));
const {buyApartment} = await import(moduleURL('apartmentInteraction.js'));
const {workerTiers} = await import(moduleURL('gameData.js'));
const {default: CoinFlip} = await import(moduleURL('coinFlip.js'));
const {ownsApartment} = await import(moduleURL('playerAccess.js'));
const player={miners:[],miningOutput:{storage:{},produced:{}},apartment:{owned:false,cost:900},keys:{KeyW:true}};
const wallet={balance:1000};
assert.equal(buyWorker(player,workerTiers[0],wallet),false);
assert.equal(wallet.balance,1000);assert.equal(player.miners.length,0);
const game=new CoinFlip(1,()=>ownsApartment(player));
const seed=game.state;
assert.equal(game.play(wallet,1,'heads',25).ok,false);assert.equal(game.state,seed);
assert.equal(buyApartment(player.apartment,wallet),true);
assert.equal(wallet.balance,100);assert.equal(ownsApartment(player),true);
assert.equal(buyWorker(player,workerTiers[0],wallet),true);assert.equal(wallet.balance,0);
assert.equal(hasLost(player,wallet),false,'Owning a miner prevents game over at zero balance');
player.miners=[];
assert.equal(hasLost(player,wallet),true);
assert.equal(hasLost(player,{balance:0.01}),false);
assert.equal(gameOverStage(DEATH_MESSAGE_MS-1),'message');
assert.equal(gameOverStage(DEATH_MESSAGE_MS),'black');
assert.equal(gameOverStage(DEATH_MESSAGE_MS+BLACK_SCREEN_MS-1),'black');
assert.equal(gameOverStage(DEATH_MESSAGE_MS+BLACK_SCREEN_MS),'retry');
const handlers={};
function node(){return {hidden:false,dataset:{},children:[],handlers:{},append(...children){this.children.push(...children);},setAttribute(){},addEventListener(name,fn){this.handlers[name]=fn;},showModal(){this.open=true;},focus(){this.focused=true;}};}
globalThis.document={createElement:node,body:{append(){},classList:{add(){}}}};
globalThis.window={addEventListener(name,fn){handlers[name]=fn;}};
let starts=0,restarts=0;
const screen=new GameOver(player,wallet,()=>starts++,()=>restarts++);
screen.canStart=()=>false;
screen.update(0);assert.equal(screen.active,false);assert.equal(starts,0,'Pending gambling result delays game over');
screen.canStart=()=>true;
screen.update(100);assert.equal(screen.active,true);assert.equal(starts,1);assert.equal(screen.stage,'message');assert.deepEqual(player.keys,{});
screen.retry.handlers.click();assert.equal(restarts,0);
screen.update(100+DEATH_MESSAGE_MS);assert.equal(screen.stage,'black');assert.equal(screen.retry.hidden,true);assert.equal(screen.message.hidden,true);
screen.update(100+DEATH_MESSAGE_MS+BLACK_SCREEN_MS-1);assert.equal(screen.stage,'black');
screen.update(100+DEATH_MESSAGE_MS+BLACK_SCREEN_MS);assert.equal(screen.stage,'retry');assert.equal(screen.retry.hidden,false);assert.equal(screen.retry.focused,true);
screen.retry.handlers.click();assert.equal(restarts,1);assert.equal(starts,1);
let cancelled=false;screen.screen.handlers.cancel({preventDefault(){cancelled=true;}});assert.equal(cancelled,true);
console.log('Passed apartment purchase/bet gates, no-money death condition, miner exemption, message/black/retry timing, restart callback, and Escape protection.');
