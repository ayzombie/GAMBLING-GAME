import { createInventoryGrid } from './inventoryView.js';

export function setupInventoryGui(gui, inventory, interaction, refreshCursor) {
    function render(content) {
        const refresh = () => { render(content); refreshCursor(); };
        content.replaceChildren(createInventoryGrid(inventory, interaction, refresh));
    }

    gui.register('inventory', { label: 'Inventory', className: 'inventory-modal player-inventory-modal', render });
    inventory.listeners.add(() => {
        if (gui.isOpen && gui.active === 'inventory') render(gui.content);
    });
    window.addEventListener('keydown', event => {
        if (event.code !== 'KeyE' || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
        if (gui.isOpen) {
            event.preventDefault();
            gui.close();
            return;
        }
        if (event.target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)) return;
        event.preventDefault();
        gui.open('inventory');
    });
}
