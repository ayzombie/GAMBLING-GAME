import Gui from './gui.js';

export function setupPauseMenu(onPause, onResume, activeGui) {
    // Separate dialog keeps the currently open inventory/market screen intact.
    const pause = new Gui({ onOpen: onPause, onClose: onResume });
    pause.register('pause', {
        label: 'Game paused',
        className: 'pause-modal',
        render(content) {
            const title = document.createElement('h2');
            title.textContent = 'Paused';
            const resume = document.createElement('button');
            resume.textContent = 'Resume';
            resume.addEventListener('click', () => pause.close());
            const hint = document.createElement('p');
            hint.textContent = 'Press Escape to resume';
            content.append(title, resume, hint);
        },
    });
    window.addEventListener('keydown', event => {
        if (pause.isOpen && event.code === 'KeyE' && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            event.stopImmediatePropagation();
            if (!event.repeat) pause.close();
            return;
        }
        if (event.code === 'Escape') {
            event.preventDefault();
            event.stopImmediatePropagation();
            if (event.repeat) return;
            if (pause.isOpen) pause.close();
            else if (activeGui.isOpen) activeGui.back();
            else pause.open('pause');
        } else if (pause.isOpen) {
            // Preserve native button/focus behavior, but block gameplay shortcuts.
            event.stopPropagation();
            if (!['Tab', 'Enter', 'Space'].includes(event.code)) event.preventDefault();
        }
    }, true);
    return pause;
}
