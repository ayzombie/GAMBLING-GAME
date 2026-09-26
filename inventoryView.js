import { createItemIcon } from './items.js';

export function createStackSlot(store, key, interaction, refresh, transferTarget = null) {
    const stack = store.get(key);
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'inventory-slot';
    const label = stack ? `${stack.type}: ${stack.count}` : typeof key === 'string' ? `${key}: 0` : 'Empty slot';
    slot.title = label;
    slot.setAttribute('aria-label', label);
    if (stack) {
        slot.append(createItemIcon(stack.type));
        if (stack.count > 1) {
            const count = document.createElement('span');
            count.className = 'inventory-count';
            count.textContent = stack.count;
            slot.append(count);
        }
    } else if (typeof key === 'string') {
        const name = document.createElement('span');
        name.className = 'empty-material-label';
        name.textContent = key;
        slot.append(name);
    }
    slot.addEventListener('click', event => {
        if (event.shiftKey) interaction.quickTransfer(store, key, transferTarget);
        else interaction.click(store, key);
        refresh();
    });
    slot.addEventListener('contextmenu', event => {
        event.preventDefault();
        interaction.click(store, key, true);
        refresh();
    });
    return slot;
}

export function createInventoryGrid(inventory, interaction, refresh, transferTarget = null) {
    const grid = document.createElement('div');
    grid.className = 'inventory-grid';
    inventory.slots.forEach((_, index) => grid.append(createStackSlot(interaction.playerStore, index, interaction, refresh, transferTarget)));
    return grid;
}

export function setupCursorStack(gui, interaction) {
    const cursor = document.createElement('div');
    cursor.className = 'cursor-stack';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.append(cursor);
    // A manual popover puts the cursor above the modal, outside its clipping box.
    cursor.setAttribute('popover', 'manual');
    document.addEventListener('pointermove', event => {
        cursor.style.left = `${event.clientX + 12}px`;
        cursor.style.top = `${event.clientY + 12}px`;
    });
    const refresh = () => {
        cursor.replaceChildren();
        if (interaction.held && gui.isOpen) {
            cursor.append(createItemIcon(interaction.held.type));
            const count = document.createElement('span');
            count.className = 'inventory-count';
            count.textContent = interaction.held.count;
            cursor.append(count);
            if (!cursor.matches(':popover-open')) cursor.showPopover();
        } else if (cursor.matches(':popover-open')) cursor.hidePopover();
    };
    gui.dialog.addEventListener('close', () => { interaction.cancel(); refresh(); });
    return refresh;
}
