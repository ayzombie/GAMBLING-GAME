import { resourcePrices, gameState } from './gameData.js';

export function countMaterial(inventory, type) {
    return inventory.slots.reduce((total, slot) => total + (slot?.type === type ? slot.count : 0), 0);
}

export function sellMaterial(inventory, type, amount) {
    if (!Object.hasOwn(resourcePrices, type) || !Number.isSafeInteger(amount) || amount < 1 || countMaterial(inventory,type) < amount) return false;
    const price = resourcePrices[type];
    if (!Number.isFinite(price) || price <= 0) return false;
    const payoutCents = Math.round(price * 100) * amount;
    const balanceCents = Math.round(gameState.balance * 100);
    if (!Number.isSafeInteger(payoutCents + balanceCents)) return false;
    let remaining = amount;
    for (let i = 0; i < inventory.slots.length && remaining; i++) {
        const slot = inventory.slots[i];
        if (slot?.type !== type) continue;
        const taken = Math.min(remaining, slot.count);
        slot.count -= taken;
        remaining -= taken;
        if (!slot.count) inventory.slots[i] = null;
    }
    gameState.balance = (balanceCents + payoutCents) / 100;
    for (const listener of inventory.listeners) listener();
    return true;
}
