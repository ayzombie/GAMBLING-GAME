// Lower this number for faster speech (milliseconds per character).
const LETTER_DELAY_MS = 30;

export function setupNewsBubble(gui, player, news, world, canvas) {
    const bubble = document.createElement('button');
    bubble.type = 'button';
    bubble.className = 'news-bubble';
    bubble.hidden = true;
    const text = document.createElement('span');
    text.className = 'news-bubble-text';
    text.setAttribute('aria-hidden', 'true');
    const hint = document.createElement('small');
    hint.setAttribute('aria-hidden', 'true');
    const title = document.createElement('strong');
    title.textContent = 'RADIO · NEWS';
    bubble.append(title, text, hint);
    document.body.append(bubble);
    let seenVersion = news.version;
    const pending = [];
    let report, letters = [], shown = 0, startedAt = 0;

    function paint(count) {
        shown = count;
        text.textContent = letters.slice(0, shown).join('');
        hint.textContent = shown < letters.length ? 'R / click · Reveal   |   Esc · Exit' : 'R / click · Exit   |   Esc · Exit';
        bubble.setAttribute('aria-label', `${letters.join('')} — ${hint.textContent}`);
    }
    function begin() {
        letters = Array.from(report?.message ?? 'No broadcasts yet. Check back later for the latest market news!');
        startedAt = performance.now();
        paint(0);
    }
    function close() {
        bubble.hidden = true;
        player.keys = {};
        bubble.blur();
    }
    function advance() {
        if (shown < letters.length) paint(letters.length);
        else close();
    }
    bubble.addEventListener('click', advance);
    // Capture dialogue controls before inventory, movement, and the Escape pause handler.
    window.addEventListener('keydown', event => {
        if (!bubble.hidden) {
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            event.stopImmediatePropagation();
            if (!['Tab', 'Enter', 'Space'].includes(event.code)) event.preventDefault();
            if (event.repeat) return;
            if (event.code === 'Escape') close();
            else if (event.code === 'KeyR') advance();
            return;
        }
    }, true);
    function update(suppressed = false) {
        if (suppressed) { seenVersion = news.version; pending.length = 0; return; }
        if (news.version !== seenVersion) {
            const fresh = news.reports.slice(0, news.version - seenVersion).reverse();
            pending.push(...fresh);
            if (pending.length > news.config.maxReports) pending.splice(0, pending.length - news.config.maxReports);
            seenVersion = news.version;
        }
        // Wait until menus close so automatic broadcasts never interrupt inventory transfers.
        if (gui.isOpen || document.body.classList.contains('game-paused') || document.hidden) return;
        if (bubble.hidden) {
            if (!pending.length || !player.inventory.slots.some(slot => slot?.type === 'Radio')) return;
            report = pending.shift();
            player.keys = {};
            bubble.hidden = false;
            begin();
        }
        const count = Math.min(letters.length, Math.floor((performance.now() - startedAt) / LETTER_DELAY_MS));
        if (count > shown) paint(count);
        // The radio speech follows the player using the world camera transform.
        const rect = canvas.getBoundingClientRect();
        const anchorX = rect.left + (player.x - world.cameraX) * world.scale * rect.width / canvas.width;
        const anchorY = rect.top + (player.y - 24 - world.cameraY) * world.scale * rect.height / canvas.height;
        const halfWidth = bubble.offsetWidth / 2;
        const centerX = Math.max(halfWidth + 12, Math.min(window.innerWidth - halfWidth - 12, anchorX));
        bubble.style.left = `${centerX}px`;
        bubble.style.top = `${Math.max(12, anchorY - bubble.offsetHeight - 14)}px`;
        bubble.style.setProperty('--tail-left', `${Math.max(18, Math.min(bubble.offsetWidth - 18, anchorX - centerX + halfWidth))}px`);
    }
    return { update, close, get isOpen() { return !bubble.hidden; } };
}
