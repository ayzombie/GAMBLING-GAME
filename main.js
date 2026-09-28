import { updateMoneyLabels } from './moneyItem.js';
import { setupCrashGui } from './crashGui.js';
import GamblingPayouts from './gamblingPayouts.js';
import { setupBalanceHud } from './balanceHud.js';
import GameOver from './gameOver.js';
import { setupStopwatchGui } from './stopwatchGui.js';
import { setupCoinFlipGui } from './coinFlipGui.js';
import Tutorial from './tutorial.js';
import { setupApartmentInteraction } from './apartmentInteraction.js';
import Player from './player.js';
import World, { SPAWN } from './world.js';
import Gui from './gui.js';
import { newsConfig, newsEvents } from './newsData.js';
import NewsSimulation from './newsSimulation.js';
import { setupNewsBubble } from './newsBubble.js';
import { setupMarketGui } from './marketGui.js';
import Inventory from './inventory.js';
import { setupInventoryGui } from './inventoryGui.js';
import { setupMiningHouseGui } from './miningHouseGui.js';
import Miner, { validateTier } from './miner.js';
import { workerTiers, startingMiners, resourcePrices, gameState, marketHistory, marketConfig } from './gameData.js';
import { MarketSimulation } from './marketSimulation.js';
import { seed } from './gameSeed.js';
import StackInteraction from './stackInteraction.js';
import { setupCursorStack } from './inventoryView.js';
import SimulationClock from './simulationClock.js';
import { setupPauseMenu } from './pauseMenu.js';
export { seed } from './gameSeed.js';


const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const player = new Player(SPAWN.x, SPAWN.y, 100, 100, 'blue');
const world = new World();
player.apartment = world.apartment;
const marketSimulation = new MarketSimulation(resourcePrices, marketHistory, gameState.gameMinutes, seed, marketConfig);
const newsSimulation = new NewsSimulation(marketSimulation, newsEvents, newsConfig, gameState.gameMinutes, seed);
player.inventory = new Inventory();
player.inventory.add('Money', 1);
player.inventory.add('Radio', 1);
workerTiers.forEach(validateTier);
player.miningOutput = { storage: {}, produced: {} };
player.miners = startingMiners.flatMap(({ tierId, count }) => {
    const tier = workerTiers.find(tier => tier.id === tierId);
    if (!tier || !Number.isSafeInteger(count) || count < 0) {
        throw new Error(`Invalid starting miner configuration: ${tierId}`);
    }
    return Array.from({ length: count }, () => new Miner(tier, player.miningOutput));
});
const simulationClock = new SimulationClock();
const gamblingPayouts = new GamblingPayouts();
const updateBalanceHud = setupBalanceHud(gameState, world);

// Register future custom screens here with gui.register(name, { render }).
const gui = new Gui({
    onOpen() { player.keys = {}; },
    onClose() { player.keys = {}; },
});
const stackInteraction = new StackInteraction(player.inventory);
const refreshCursor = setupCursorStack(gui, stackInteraction);
const gameOver = new GameOver(player, gameState, () => {
    simulationClock.pause(performance.now());
    stackInteraction.cancel();
    newsBubble.close();
    tutorial.flow.set('done');
    tutorial.update();
    for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
    const cursor = document.querySelector('.cursor-stack');
    if (cursor?.matches(':popover-open')) cursor.hidePopover();
});
const tutorial = new Tutorial(player, world, gui, gameState, canvas, stackInteraction);
const tutorialCanOpen = gui.canOpen;
gui.canOpen = name => !gameOver.active && tutorialCanOpen(name) &&
    (world.scene === 'outside' || !['market', 'mining-house'].includes(name)) &&
    (!['coin-flip', 'stopwatch', 'crash'].includes(name) || world.scene === 'casino');
window.addEventListener('keydown', event => {
    if (event.code !== 'KeyR' || event.repeat || event.ctrlKey || event.metaKey || event.altKey ||
        event.target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName) ||
        tutorial.active || gui.isOpen || newsBubble.isOpen || simulationClock.paused || document.hidden) return;
    if (world.useCasinoDoor(player)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        world.update(player, canvas.width, canvas.height);
    }
}, true);
setupApartmentInteraction(world, player, gui, gameState, tutorial);
setupInventoryGui(gui, player.inventory, stackInteraction, refreshCursor);
const newsBubble = setupNewsBubble(gui, player, newsSimulation, world, canvas);
const coinFlipGui = setupCoinFlipGui(gui, world, player, seed, gamblingPayouts);
const stopwatchGui = setupStopwatchGui(gui, world, player, seed, gamblingPayouts);
const crashGui = setupCrashGui(gui, world, player, seed);
gameOver.canStart = () => !gamblingPayouts.hasPending && !coinFlipGui.blocksGameOver && !stopwatchGui.blocksGameOver && !crashGui.blocksGameOver;
const updateMarketGui = setupMarketGui(gui, world.market, player);
const updateMiningGui = setupMiningHouseGui(gui, world.miningHouse, player, stackInteraction, refreshCursor);
setupPauseMenu(() => {
    advanceSimulation(simulationClock.pause(performance.now()));
    document.body.classList.add('game-paused');
    player.keys = {};
    const cursor = document.querySelector('.cursor-stack');
    if (cursor?.matches(':popover-open')) cursor.hidePopover();
}, () => {
    if (gameOver.active) return;
    simulationClock.resume(performance.now());
    document.body.classList.remove('game-paused');
    player.keys = {};
    refreshCursor();
}, gui);

function advanceSimulation(deltaSeconds) {
    gamblingPayouts.update();
    gameOver.update();
    if (deltaSeconds <= 0 || tutorial.frozen || gameOver.active) return;
    for (const miner of player.miners) miner.update(deltaSeconds);
    gameState.gameMinutes += deltaSeconds * marketConfig.gameMinutesPerSecond;
    newsSimulation.update(gameState.gameMinutes);
}

document.addEventListener('visibilitychange', () => {
    player.keys = {};
    advanceSimulation(simulationClock.tick(performance.now()));
});
// Background timers may be throttled; elapsed-time catch-up preserves all progress.
setInterval(() => {
    if (document.hidden) advanceSimulation(simulationClock.tick(performance.now()));
}, 1000);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function drawClock() {
    const minutes = Math.floor(gameState.gameMinutes) % 1440;
    const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
    const minuteText = String(minutes % 60).padStart(2, '0');
    ctx.save();
    ctx.fillStyle = world.scene === 'casino' ? '#fff0c7' : '#242424';
    ctx.font = 'bold 25px Arial';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    ctx.fillText(`${hours}:${minuteText}`, canvas.width - 22, 32);
    ctx.restore();
}

function gameLoop(now) {
    crashGui.update();
    stopwatchGui.update();
    gamblingPayouts.update(now);
    gameOver.update(now);
    updateBalanceHud(gameOver.active);
    updateMoneyLabels();
    if (gameOver.active) { requestAnimationFrame(gameLoop); return; }
    const deltaSeconds = simulationClock.tick(now);
    if (!simulationClock.paused && !gui.isOpen && !newsBubble.isOpen && tutorial.canMove && !document.hidden) {
        player.update(world);
    }
    advanceSimulation(deltaSeconds);
    updateMarketGui();
    coinFlipGui.update();
    updateMiningGui();
    world.update(player, canvas.width, canvas.height);
    world.draw(ctx, canvas.width, canvas.height, player);
    newsBubble.update(tutorial.active);
    drawClock();
    tutorial.update();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
