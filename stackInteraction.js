import { items } from './items.js';

export function inventoryStore(inventory) {
    return {
        get: index => inventory.slots[index],
        set(index, stack) { inventory.slots[index] = stack; },
        limit: type => items[type].maxStack,
        snapshot: () => inventory.slots.map(slot => slot ? { ...slot } : null),
        restore(slots) { inventory.slots = slots; },
    };
}

export function minerStore(miner) {
    return {
        get: type => miner.storage[type] > 0 ? { type, count: miner.storage[type] } : null,
        set(type, stack) {
            if (stack && stack.type !== type) throw new Error('Wrong material slot');
            miner.storage[type] = stack?.count ?? 0;
        },
        accepts: () => false, // Output is collection-only; cancellation still restores unfinished pickups.
        limit: () => Infinity,
        snapshot: () => ({ storage: { ...miner.storage }, produced: { ...miner.produced } }),
        restore(snapshot) {
            const storage = { ...snapshot.storage };
            // Production continues while a stack is held. Preserve newly mined items.
            for (const [type, count] of Object.entries(miner.produced ?? {})) {
                storage[type] = (storage[type] ?? 0) + count - (snapshot.produced[type] ?? 0);
            }
            miner.storage = storage;
        },
    };
}

export default class StackInteraction {
    constructor(inventory) {
        this.inventory = inventory;
        this.playerStore = inventoryStore(inventory);
        this.held = null;
        this.journal = new Map();
    }

    remember(store) {
        if (!this.journal.has(store)) this.journal.set(store, store.snapshot());
    }

    click(store, key, right = false) {
        const slot = store.get(key);
        this.remember(store);
        if (!this.held) {
            if (slot) {
                const amount = right ? 1 : Math.min(items[slot.type].maxStack, slot.count);
                this.held = { type: slot.type, count: amount };
                store.set(key, slot.count > amount ? { ...slot, count: slot.count - amount } : null);
            }
        } else if (!store.accepts || store.accepts(key, this.held.type)) {
            if (!slot || slot.type === this.held.type) {
                const amount = Math.min(right ? 1 : this.held.count, store.limit(this.held.type) - (slot?.count ?? 0));
                if (amount > 0) {
                    store.set(key, { type: this.held.type, count: (slot?.count ?? 0) + amount });
                    this.held.count -= amount;
                    if (!this.held.count) this.held = null;
                }
            } else if (!right && slot.count <= items[slot.type].maxStack) {
                store.set(key, { ...this.held });
                this.held = { ...slot };
            }
        }
        if (!this.held) this.journal.clear();
    }

    quickTransfer(store, key, otherMiner = null) {
        if (this.held) return;
        const slot = store.get(key);
        if (!slot) return;
        if (store !== this.playerStore) {
            const moved = this.inventory.addSome(slot.type, slot.count);
            store.set(key, slot.count > moved ? { ...slot, count: slot.count - moved } : null);
        } else if (otherMiner && (!otherMiner.accepts || otherMiner.accepts(slot.type, slot.type)) && items[slot.type].category !== 'equipment') {
            const existing = otherMiner.get(slot.type);
            otherMiner.set(slot.type, { type: slot.type, count: (existing?.count ?? 0) + slot.count });
            store.set(key, null);
        }
    }

    cancel() {
        // Return an unfinished cursor transaction without deleting or duplicating items.
        for (const [store, snapshot] of this.journal) store.restore(snapshot);
        this.journal.clear();
        this.held = null;
    }
}
