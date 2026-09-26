import { ownsApartment } from './playerAccess.js';
import Miner from './miner.js';

export function buyWorker(player, tier, wallet) {
    if (!ownsApartment(player) || player.miners.some(miner => miner.tier.id === tier.id) ||
        !Number.isSafeInteger(tier.cost) || tier.cost < 0 ||
        !Number.isFinite(wallet.balance) || wallet.balance < tier.cost) return false;
    const miner = new Miner(tier, player.miningOutput);
    wallet.balance -= tier.cost;
    player.miners.push(miner);
    return true;
}
