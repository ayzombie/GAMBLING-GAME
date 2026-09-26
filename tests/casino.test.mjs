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


const {default: World, MAP_LENGTH, MAP_HEIGHT, SPAWN} = await import(moduleURL('world.js'));
const world = new World();
const player = {...SPAWN, keys: {KeyR: true}, draw(){}};
assert.equal(world.useCasinoDoor(player, 0), false);
const building = world.casino;
player.x=building.x+building.size*.44;player.y=building.y+building.size*.85+35;
assert.equal(building.blocksPlayer(player.x,player.y),false);
const outside={x:player.x,y:player.y};
assert.equal(world.useCasinoDoor(player, 1000), true);
assert.equal(world.scene,'casino');
assert.deepEqual({x:player.x,y:player.y},world.casinoInterior.spawn);
assert.deepEqual(player.keys,{});
assert.equal(world.casinoInterior.width,MAP_LENGTH);assert.equal(world.casinoInterior.height,MAP_HEIGHT);
assert.equal(world.casinoInterior.blocked(player.x,player.y),false);
assert.equal(world.useCasinoDoor(player, 1600),false,'Must be near exit');
world.movePlayer(player,0,100);
assert.equal(world.casinoInterior.canExit(player),true);
assert.equal(world.useCasinoDoor(player, 1200),false,'Transition cooldown');
assert.equal(world.useCasinoDoor(player, 1700),true);
assert.equal(world.scene,'outside');assert.deepEqual({x:player.x,y:player.y},outside);
assert.equal(world.useCasinoDoor(player, 1800),false);
assert.equal(world.useCasinoDoor(player, 2300),true);
const prop=world.casinoInterior.props[0];
player.x=prop.x-30;player.y=prop.y+30;
world.movePlayer(player,100,0);assert.ok(player.x<=prop.x-15,'Furniture blocks movement');
player.x=MAP_LENGTH/2;player.y=MAP_HEIGHT-200;
world.movePlayer(player,0,1000);assert.ok(player.y<=MAP_HEIGHT-65,'Interior wall bounds');
world.update(player,900,600);assert.ok(world.cameraX>=0&&world.cameraY>=0);
// Exercise both canvas render paths, checking for invalid coordinates.
const ctx=new Proxy({}, {get(target,key){return target[key]??((...args)=>{for(const arg of args)if(typeof arg==='number')assert.ok(Number.isFinite(arg),String(key));});},set(target,key,value){target[key]=value;return true;}});
world.draw(ctx,900,600,player);
world.scene='outside';world.draw(ctx,900,600,player);
console.log('Passed casino entry/exit, return location, cooldown, same-size map, furniture/wall collisions, camera and drawing smoke checks.');
