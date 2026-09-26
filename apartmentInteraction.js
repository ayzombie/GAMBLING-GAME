export function buyApartment(apartment, wallet) {
    if (apartment.owned || !Number.isFinite(wallet.balance) || wallet.balance < apartment.cost) return false;
    wallet.balance -= apartment.cost;
    apartment.owned = true;
    return true;
}

export function setupApartmentInteraction(world, player, gui, wallet, tutorial) {
    window.addEventListener('keydown', event => {
        if (event.code !== 'KeyR' || event.repeat || event.ctrlKey || event.metaKey || event.altKey ||
            event.target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName) ||
            world.scene !== 'outside' || gui.isOpen || document.body.classList.contains('game-paused') ||
            (tutorial.active && tutorial.flow.state !== 'apartmentBuy') || !world.apartment.canInteract(player)) return;
        event.preventDefault();
        buyApartment(world.apartment, wallet);
    });
}
