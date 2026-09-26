import TutorialFlow from './tutorialFlow.js';

export default class Tutorial {
    constructor(player, world, gui, wallet, canvas, interaction) {
        Object.assign(this, { player, world, gui, canvas });
        this.flow = new TutorialFlow(player, world, gui, wallet, interaction);
        this.lastState = null;
        this.root = document.createElement('div');
        this.root.className = 'tutorial-overlay';
        this.root.setAttribute('popover', 'manual');
        this.spot = document.createElement('div'); this.spot.className = 'tutorial-spot';
        this.arrow = document.createElement('div'); this.arrow.className = 'tutorial-arrow';
        this.arrow.textContent = '➜'; this.arrow.setAttribute('aria-hidden', 'true');
        this.panel = document.createElement('section'); this.panel.className = 'tutorial-panel';
        this.panel.setAttribute('aria-label', 'Tutorial');
        this.root.append(this.spot, this.arrow, this.panel);
        document.body.append(this.root);
        this.root.showPopover();
        gui.canOpen = name => this.flow.canOpenGui(name);
        gui.canClose = () => this.flow.canCloseGui;
        // Installed before other shortcut handlers, including Escape-to-pause.
        window.addEventListener('keydown', event => this.keydown(event), true);
        for (const name of ['click', 'pointerdown', 'contextmenu']) {
            window.addEventListener(name, event => {
                if (!this.active || this.panel.contains(event.target) || this.allowedTarget(event.target)) return;
                event.preventDefault(); event.stopImmediatePropagation();
            }, true);
        }
        this.update();
    }
    get active() { return this.flow.active; }
    get frozen() { return this.flow.frozen; }
    get canMove() { return this.flow.canMove; }
    allowedTarget(target) {
        if (!(target instanceof Element)) return false;
        const state = this.flow.state;
        if (state === 'minerBuy') return !!target.closest('[data-worker-id="wooden"]');
        if (state === 'collect') return !!target.closest('.master-output .inventory-slot, .master-player-inventory .inventory-slot');
        if (state === 'sell') {
            const item = target.closest('[data-material], [data-sell-material]');
            return item && (item.dataset.material ?? item.dataset.sellMaterial) === this.flow.material;
        }
        return false;
    }
    keydown(event) {
        if (!this.active || event.ctrlKey || event.metaKey || event.altKey) return;
        const code = event.code;
        if (code === 'Tab') return;
        if (this.panel.contains(event.target) && ['Enter', 'Space'].includes(code)) return;
        if (['Enter', 'Space'].includes(code) && this.allowedTarget(event.target)) return;
        if (this.canMove && ['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(code)) return;
        if (code === 'KeyR' && ['apartmentBuy', 'minerWalk', 'marketWalk', 'leaveMine', 'leaveMarket'].includes(this.flow.state)) return;
        if (['Escape', 'KeyE'].includes(code) && this.flow.canCloseGui && this.gui.isOpen) return;
        event.preventDefault(); event.stopImmediatePropagation();
        if (!event.repeat && this.flow.hasContinue && ['KeyR', 'Enter', 'Space'].includes(code)) this.flow.next();
    }
    renderPanel() {
        this.panel.replaceChildren();
        const title = document.createElement('strong');
        title.textContent = this.flow.state === 'choice' ? 'Do Tutorial?' : 'Tutorial';
        this.panel.append(title);
        const button = (text, action) => {
            const node = document.createElement('button'); node.type = 'button'; node.textContent = text;
            node.addEventListener('click', action); this.panel.append(node); return node;
        };
        if (this.flow.state === 'choice') {
            button('Yes', () => this.flow.choose(true));
            button('No', () => this.flow.choose(false));
        } else {
            const message = document.createElement('p'); message.textContent = this.flow.message;
            message.setAttribute('aria-live', 'polite'); this.panel.append(message);
            if (this.flow.hasContinue) button(this.flow.state === 'complete' ? 'Finish' : 'Continue', () => this.flow.next());
            else if (['leaveMine', 'leaveMarket'].includes(this.flow.state)) button('Close', () => this.gui.close());
            else {
                const hint = document.createElement('small');
                hint.textContent = this.canMove ? 'WASD to move · Follow the arrow · R to interact' :
                    this.flow.state === 'collect' ? 'Shift-click a material, or pick it up and place it in an inventory slot.' :
                    this.flow.state === 'minerBuy' ? 'Buy the Wooden worker for $100.' : '';
                this.panel.append(hint);
            }
        }
        this.root.classList.toggle('tutorial-choice', this.flow.state === 'choice');
    }
    worldRect(x, y, width = 0, height = 0) {
        const rect = this.canvas.getBoundingClientRect();
        const sx = this.world.scale * rect.width / this.canvas.width;
        const sy = this.world.scale * rect.height / this.canvas.height;
        return { x: rect.left + (x - this.world.cameraX) * sx, y: rect.top + (y - this.world.cameraY) * sy,
            width: width * sx, height: height * sy };
    }
    target() {
        const state = this.flow.state;
        if (['balance', 'spend'].includes(state)) return { x: 12, y: 12, width: 260, height: 40 };
        if (state === 'time') return { x: window.innerWidth - 110, y: 12, width: 100, height: 40 };

        let building;
        if (state === 'casino') building = this.world.casino;
        if (state.startsWith('apartment') || state === 'home') building = this.world.apartment;
        if (state === 'minerWalk') building = this.world.miningHouse;
        if (state === 'marketWalk') building = this.world.market;
        if (building) return this.worldRect(building.x, building.y, building.size, building.size);
        let selector;
        if (state === 'minerBuy') selector = '[data-worker-id="wooden"]';
        if (['output', 'waitOutput', 'collect'].includes(state)) selector = '.master-output';
        if (state === 'leaveMine') selector = '.master-player-inventory';
        if (state === 'sell') {
            const buttons = [...this.gui.content.querySelectorAll('[data-material], [data-sell-material]')];
            const target = buttons.find(button => (button.dataset.material ?? button.dataset.sellMaterial) === this.flow.material);
            return target?.getBoundingClientRect();
        }
        return selector ? this.gui.content.querySelector(selector)?.getBoundingClientRect() : null;
    }
    position(rect) {
        const width = window.innerWidth, height = window.innerHeight;
        if (!rect) {
            Object.assign(this.spot.style, { left: '50%', top: '50%', width: '0px', height: '0px', borderWidth: '0' });
            this.arrow.hidden = true;
            return;
        }
        this.arrow.hidden = false;
        const cx = rect.x + rect.width / 2, cy = rect.y + rect.height / 2;
        const onScreen = rect.x < width && rect.x + rect.width > 0 && rect.y < height && rect.y + rect.height > 0;
        let x, y, rotation;
        let hole;
        if (onScreen) {
            const left = Math.max(6, rect.x - 6), top = Math.max(6, rect.y - 6);
            hole = { x: left, y: top,
                width: Math.max(0, Math.min(width - 6, rect.x + rect.width + 6) - left),
                height: Math.max(0, Math.min(height - 6, rect.y + rect.height + 6) - top) };
            x = Math.max(32, Math.min(width - 32, cx));
            y = Math.max(32, Math.min(height - 32, rect.y > 65 ? rect.y - 32 : rect.y + rect.height + 30));
            rotation = Math.atan2(cy - y, cx - x) * 180 / Math.PI;
        } else {
            const dx = cx - width / 2, dy = cy - height / 2;
            const factor = Math.min((width / 2 - 38) / Math.max(1, Math.abs(dx)), (height / 2 - 38) / Math.max(1, Math.abs(dy)));
            x = width / 2 + dx * factor; y = height / 2 + dy * factor;
            rotation = Math.atan2(dy, dx) * 180 / Math.PI;
            hole = { x: x - 25, y: y - 25, width: 50, height: 50 };
        }
        Object.assign(this.spot.style, { left: `${hole.x}px`, top: `${hole.y}px`, width: `${hole.width}px`, height: `${hole.height}px`, borderWidth: '2px' });
        Object.assign(this.arrow.style, { left: `${x}px`, top: `${y}px`, transform: `translate(-50%, -50%) rotate(${rotation}deg)` });
        // Keep the bubble away from the highlighted control.
        this.panel.classList.toggle('tutorial-panel-top', this.gui.isOpen && cy > height / 2);
    }
    update() {
        this.flow.update();
        this.world.apartment.showPurchasePrompt = !this.active || this.flow.state === 'apartmentBuy';
        document.body.classList.toggle('tutorial-frozen', this.frozen);
        if (!this.active) {
            if (this.root.matches(':popover-open')) this.root.hidePopover();
            return;
        }
        // A child of an open dialog remains interactive; popover keeps it above the dialog.
        const host = this.gui.isOpen ? this.gui.dialog : document.body;
        if (this.root.parentElement !== host) {
            if (this.root.matches(':popover-open')) this.root.hidePopover();
            host.append(this.root); this.root.showPopover();
        }
        if (this.lastState !== this.flow.state) {
            this.lastState = this.flow.state;
            this.renderPanel();
            if (this.gui.isOpen) {
                const selector = this.flow.state === 'minerBuy' ? '[data-worker-id="wooden"]' :
                    ['output', 'waitOutput', 'collect'].includes(this.flow.state) ? '.master-output' : null;
                if (selector) this.gui.content.querySelector(selector)?.scrollIntoView({ block: 'center' });
            }
        }
        if (!this.root.matches(':popover-open')) this.root.showPopover();
        this.position(this.target());
    }
}
