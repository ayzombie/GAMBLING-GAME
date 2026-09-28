import { gameState } from './gameData.js';

// Update the bundle wherever it is displayed, including while held by the cursor.
// Its value is the existing wallet, so moving/cancelling it never copies money.
export function updateMoneyLabels() {
    const amount = `$${gameState.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    for (const label of document.querySelectorAll('[data-money-amount]')) {
        if (label.textContent !== amount) label.textContent = amount;
    }
    for (const slot of document.querySelectorAll('[data-money-slot]')) {
        const text = `Money: ${amount}`;
        if (slot.title !== text) { slot.title = text; slot.setAttribute('aria-label', text); }
    }
}
