import { resourcePrices } from './gameData.js';
import { SPAWN } from './world.js';

const DIALOGUES = {
    balance: 'This is your balance. It is how much money you have.',
    spend: 'Right now, you have $1000. Lets spend it on something.',
    apartmentPrompt: 'Buy the apartment.',
    home: 'This is where you will sleep at night. Try not to skip sleep.',
    time: 'This watch will tell you the time.',
    output: "This is where all your worker's products will be.",
    casino: 'You can gamble money here.',
    complete: "You've completed the tutorial! Go earn some money! Be careful about rent!",
};

export default class TutorialFlow {
    constructor(player, world, gui, wallet, interaction = null) {
        Object.assign(this, { player, world, gui, wallet, interaction });
        this.state = 'choice';
        this.material = null;
        this.saleCount = 0;
        this.saleBalance = 0;
    }
    get active() { return this.state !== 'done'; }
    get frozen() { return this.state === 'choice' || Object.hasOwn(DIALOGUES, this.state); }
    get canMove() { return !this.active || ['apartmentWalk', 'minerWalk', 'marketWalk'].includes(this.state); }
    get canCloseGui() { return !this.active || ['leaveMine', 'leaveMarket'].includes(this.state); }
    canOpenGui(name) {
        return !this.active || (name === 'mining-house' && this.state === 'minerWalk') ||
            (name === 'market' && this.state === 'marketWalk');
    }
    choose(yes) { if (this.state === 'choice') this.set(yes ? 'balance' : 'done'); }
    set(state) { this.state = state; this.player.keys = {}; }
    next() {
        const next = { balance: 'spend', spend: 'apartmentWalk', apartmentPrompt: 'apartmentBuy',
            home: 'time', time: 'minerWalk', output: 'waitOutput', casino: 'complete', complete: 'done' }[this.state];
        if (!next) return;
        if (next === 'complete') Object.assign(this.player, SPAWN);
        this.set(next);
    }
    count(type) {
        return this.player.inventory.slots.reduce((sum, slot) => sum + (slot?.type === type ? slot.count : 0), 0);
    }
    get message() {
        return DIALOGUES[this.state] ?? {
            apartmentWalk: 'Go to the apartment.', apartmentBuy: 'R · Buy ($900)',
            minerWalk: 'Go hire some workers.', minerBuy: 'Buy the Wooden worker.',
            waitOutput: 'Waiting for your first material…', collect: 'Put them in your inventory.',
            leaveMine: 'Close the worker screen to continue.',
            marketWalk: 'Go sell your materials on the market.',
            sell: `Each material's value may change over time. Sell your ${this.material}.`,
            leaveMarket: 'Close the market to continue.',
        }[this.state] ?? '';
    }
    get hasContinue() { return Object.hasOwn(DIALOGUES, this.state); }
    update() {
        switch (this.state) {
            case 'apartmentWalk':
                if (this.world.apartment.canInteract(this.player)) this.set('apartmentPrompt');
                break;
            case 'apartmentBuy':
                if (this.world.apartment.owned) this.set('home');
                break;
            case 'minerWalk':
                if (this.gui.isOpen && this.gui.active === 'mining-house') this.set('minerBuy');
                break;
            case 'minerBuy':
                if (this.player.miners.some(miner => miner.tier.id === 'wooden')) this.set('output');
                break;
            case 'waitOutput':
                if (Object.entries(this.player.miningOutput.storage).some(([type, count]) => count > 0 && Object.hasOwn(resourcePrices, type))) this.set('collect');
                break;
            case 'collect': {
                const collected = this.player.inventory.slots.find(slot => slot && Object.hasOwn(resourcePrices, slot.type) && slot.count > 0);
                if (collected && !this.interaction?.held) { this.material = collected.type; this.set('leaveMine'); }
                break;
            }
            case 'leaveMine':
                if (!this.gui.isOpen) this.set('marketWalk');
                break;
            case 'marketWalk':
                if (this.gui.isOpen && this.gui.active === 'market') {
                    this.saleCount = this.count(this.material);
                    this.saleBalance = this.wallet.balance;
                    this.set('sell');
                }
                break;
            case 'sell':
                if (this.count(this.material) < this.saleCount && this.wallet.balance > this.saleBalance) this.set('leaveMarket');
                break;
            case 'leaveMarket':
                if (!this.gui.isOpen) this.set('casino');
                break;
        }
    }
}
