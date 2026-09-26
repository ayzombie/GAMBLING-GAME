// A top-layer popover stays sharp above native dialogs and their blurred backdrops.
export function setupBalanceHud(wallet, world) {
    const label = document.createElement('div');
    label.className = 'balance-hud';
    label.setAttribute('popover', 'manual');
    label.setAttribute('aria-label', 'Balance');
    document.body.append(label);
    let previousDialog = null;
    return (hidden = false) => {
        if (hidden) {
            if (label.matches(':popover-open')) label.hidePopover();
            return;
        }
        label.textContent = `Balance: $${wallet.balance.toFixed(2)}`;
        label.classList.toggle('balance-hud-light', world.scene === 'casino');
        const dialog = [...document.querySelectorAll('dialog[open]')].at(-1) ?? null;
        if (dialog !== previousDialog) {
            if (label.matches(':popover-open')) label.hidePopover();
            previousDialog = dialog;
        }
        if (!label.matches(':popover-open')) label.showPopover();
    };
}
