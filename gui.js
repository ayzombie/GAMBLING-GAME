// Reuse with gui.register('name', { label, render(content, data) { ... } });
// Then call gui.open('name', data). Escape or a backdrop click closes it.
export default class Gui {
    constructor({ onOpen = () => {}, onClose = () => {} } = {}) {
        this.screens = new Map();
        this.active = null;
        this.backHandler = null;
        this.onOpen = onOpen;
        this.onClose = onClose;
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'game-modal';
        this.dialog.tabIndex = -1;
        this.content = document.createElement('div');
        this.content.className = 'game-modal-content';
        this.dialog.append(this.content);
        document.body.append(this.dialog);
        this.dialog.addEventListener('click', event => {
            const rect = this.dialog.getBoundingClientRect();
            if (event.target === this.dialog && (event.clientX < rect.left || event.clientX > rect.right ||
                event.clientY < rect.top || event.clientY > rect.bottom)) this.close();
        });
        this.dialog.addEventListener('cancel', event => {
            event.preventDefault();
            this.back();
        });
        this.dialog.addEventListener('close', () => {
            this.active = null;
            this.backHandler = null;
            this.content.replaceChildren();
            this.onClose();
        });
    }

    get isOpen() {
        return this.dialog.open;
    }

    register(name, { label = name, className = '', render = () => {} } = {}) {
        this.screens.set(name, { label, className, render });
    }

    open(name, data) {
        if (this.isOpen || (this.canOpen && !this.canOpen(name))) return false;
        const screen = this.screens.get(name);
        if (!screen) throw new Error(`Unknown GUI: ${name}`);
        this.backHandler = null;
        this.content.replaceChildren();
        this.content.className = 'game-modal-content';
        this.dialog.className = `game-modal ${screen.className}`.trim();
        this.dialog.setAttribute('aria-label', screen.label);
        screen.render(this.content, data);
        this.active = name;
        this.dialog.showModal();
        this.dialog.focus();
        this.onOpen();
        return true;
    }

    setBack(handler = null) {
        this.backHandler = handler;
    }

    back() {
        if (!this.isOpen || (this.canClose && !this.canClose())) return;
        if (this.backHandler) this.backHandler();
        else this.close();
    }

    close() {
        if (this.isOpen && (!this.canClose || this.canClose())) this.dialog.close();
    }
}
