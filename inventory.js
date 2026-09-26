import { items } from './items.js';

export default class Inventory {
    constructor() {
        this.slots = Array(20).fill(null);
        this.listeners = new Set();
    }

    // Future pickups can call player.inventory.add('Copper', 1).
    addSome(type, count) {
        if (!Object.hasOwn(items, type) || !Number.isSafeInteger(count) || count < 1) return 0;
        const maximum = items[type].maxStack;
        const capacity = this.slots.reduce((sum, slot) => sum + (
            slot === null ? maximum : slot.type === type ? maximum - slot.count : 0
        ), 0);
        const amount = Math.min(count, capacity);
        return amount && this.add(type, amount) ? amount : 0;
    }

    // False means nothing was added (unknown item, invalid count, or no space).
    add(type, count = 1) {
        if (!Object.hasOwn(items, type) || !Number.isSafeInteger(count) || count < 1) return false;
        const maximum = items[type].maxStack;
        const capacity = this.slots.reduce((sum, slot) => sum + (
            slot === null ? maximum : slot.type === type ? maximum - slot.count : 0
        ), 0);
        if (capacity < count) return false;
        let remaining = count;
        for (const slot of this.slots) {
            if (slot?.type !== type) continue;
            const amount = Math.min(remaining, maximum - slot.count);
            slot.count += amount;
            remaining -= amount;
            if (!remaining) break;
        }
        for (let i = 0; i < this.slots.length && remaining; i++) {
            if (this.slots[i] !== null) continue;
            const amount = Math.min(remaining, maximum);
            this.slots[i] = { type, count: amount };
            remaining -= amount;
        }
        for (const listener of this.listeners) listener();
        return true;
    }
}
