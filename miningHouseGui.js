import { ownsApartment, APARTMENT_REQUIRED } from './playerAccess.js';
import { buyWorker } from './minerShop.js';
import { workerTiers, gameState, minerUpgrades } from './gameData.js';
import { createItemIcon } from './items.js';
import { createWorkerIcon } from './workerIcon.js';
import { minerStore } from './stackInteraction.js';
import { createStackSlot, createInventoryGrid } from './inventoryView.js';

const TIER_ORDER = ['wooden', 'stone', 'copper', 'reinforced-iron', 'reinforced-diamond',
    'titanium', 'graphene', 'tungsten', 'chromium', 'diamond-infused-carbon'];

export function setupMiningHouseGui(gui, house, player, interaction, refreshCursor) {
    const output = minerStore(player.miningOutput);
    let outputPanel = null;
    let inventoryPanel = null;
    let countdown = null;
    let cycleBar = null;
    let selectedMiner = null;
    let signature = '';
    let walletLabel = null;
    let upgradeButtons = [];
    let purchaseButtons = [];
    let shopBalance = null;
    const element = (tag, text, className = '') => {
        const node = document.createElement(tag);
        node.textContent = text;
        node.className = className;
        return node;
    };
    function refreshOutput() {
        if (!outputPanel) return;
        outputPanel.replaceChildren();
        for (const [type, count] of Object.entries(player.miningOutput.storage)) {
            if (count > 0) outputPanel.append(createStackSlot(output, type, interaction, refreshTransfers));
        }
        signature = JSON.stringify(player.miningOutput.storage);
    }
    function refreshTransfers() {
        refreshOutput();
        if (inventoryPanel) inventoryPanel.replaceChildren(createInventoryGrid(player.inventory, interaction, refreshTransfers, output));
        refreshCursor();
    }
    function showDetails(content, tier, miner) {
        gui.setBack(() => showList(content));
        outputPanel = inventoryPanel = null;
        purchaseButtons = [];
        shopBalance = null;
        selectedMiner = miner;
        gui.dialog.classList.add('miner-detail-modal');
        content.replaceChildren();
        const back = element('button', '← Back');
        back.addEventListener('click', () => gui.back());
        upgradeButtons = [];
        const toolbar = element('div', '', 'miner-toolbar');
        walletLabel = element('span', '', 'miner-wallet');
        toolbar.append(back, walletLabel);
        const hero = element('div', '', 'miner-hero');
        hero.style.setProperty('--tier-color', tier.color);
        const identity = element('div', '', 'miner-identity');
        identity.append(element('small', `TIER ${TIER_ORDER.indexOf(tier.id) + 1}`), element('h2', tier.name),
            element('span', miner ? 'Working · Shared output' : 'Not hired', 'miner-status'));
        hero.append(createWorkerIcon(tier, TIER_ORDER.indexOf(tier.id)), identity);
        content.append(toolbar, hero);
        const fortune = miner?.resourcesPerCycle ?? tier.resourcesPerCycle;
        const cycle = miner?.cycleSeconds ?? tier.cycleSeconds;
        const attributes = element('div', '', 'miner-attributes');
        for (const [label, value, help] of [
            ['Fortune', fortune, 'Maximum resources per cycle'],
            ['Cycle time', `${cycle.toFixed(2)}s`, 'Time between mining cycles'],
        ]) {
            const card = element('div', '', 'miner-stat-card');
            card.append(element('small', label), element('strong', value), element('small', help));
            attributes.append(card);
        }
        content.append(attributes);
        const upgrades = element('div', '', 'miner-upgrades');
        for (const [track, label] of [['resources', 'Fortune'], ['cycle', 'Cycle Time']]) {
            const block = element('div', '', 'miner-upgrade-block');
            const cost = miner?.upgradeCost(track);
            const button = element('button', !miner ? `Upgrade ${label} (Not owned)` : cost === null ? `Upgrade ${label} (MAX)` : `Upgrade ${label} ($${cost})`);
            button.disabled = !miner || cost === null || gameState.balance < cost;
            upgradeButtons.push({ button, cost });
            button.addEventListener('click', () => {
                const scroll = gui.dialog.scrollTop;
                miner.buyUpgrade(track, gameState);
                showDetails(content, tier, miner);
                gui.dialog.scrollTop = scroll;
            });
            const reduction = Number(((1 - minerUpgrades.cycleMultiplierPerLevel) * 100).toFixed(4));
            const preview = track === 'resources' ? `+${minerUpgrades.extraResourcesPerLevel} Fortune`
                : `-${reduction}% Cooldown (${cycle.toFixed(2)}s → ${(cycle * minerUpgrades.cycleMultiplierPerLevel).toFixed(2)}s)`;
            block.append(element('h3', label), element('p', miner && cost === null ? 'Maximum level reached' : preview), button);
            if (miner) block.append(element('small', `Level ${track === 'resources' ? miner.resourceLevel : miner.cycleLevel}/${minerUpgrades.maxLevel}`));
            upgrades.append(block);
        }
        content.append(upgrades);
        const progressSection = element('div', '', 'miner-cycle-section');
        countdown = element('p', '', 'miner-countdown');
        cycleBar = document.createElement('progress');
        cycleBar.className = 'miner-cycle-bar';
        cycleBar.max = 1;
        cycleBar.value = 0;
        cycleBar.setAttribute('aria-label', 'Mining cycle completion');
        progressSection.append(countdown, cycleBar);
        content.append(progressSection);
        updateCountdown();
        const drops = element('section', '', 'miner-drops');
        drops.append(element('h3', 'Can Mine'));
        const dropList = element('div', '', 'miner-drop-list');
        const totalWeight = tier.drops.reduce((sum, drop) => sum + drop.weight, 0);
        for (const drop of tier.drops.filter(drop => drop.weight > 0)) {
            const row = element('div', '', 'miner-drop');
            row.append(createItemIcon(drop.type), element('span', drop.type),
                element('strong', `${Number((drop.weight / totalWeight * 100).toFixed(2))}%`));
            dropList.append(row);
        }
        drops.append(dropList);
        content.append(drops);
        if (!miner) content.append(element('p', 'This worker has not been hired.'));
    }
    function updateCountdown() {
        if (!countdown) return;
        walletLabel.textContent = `Balance: $${gameState.balance.toFixed(2)}`;
        for (const { button, cost } of upgradeButtons) {
            button.disabled = !selectedMiner || cost === null || gameState.balance < cost;
        }
        countdown.textContent = selectedMiner
            ? `Next Cycle Completion: ${Math.max(0, selectedMiner.cycleSeconds - selectedMiner.elapsed).toFixed(1)} Seconds`
            : 'Next Cycle Completion: Not active';
        cycleBar.value = selectedMiner ? Math.max(0, Math.min(1, selectedMiner.progress)) : 0;
        cycleBar.setAttribute('aria-valuetext', countdown.textContent);
    }
    function showList(content) {
        gui.setBack();
        countdown = cycleBar = selectedMiner = null;
        gui.dialog.classList.remove('miner-detail-modal');
        content.replaceChildren();
        content.append(element('h2', 'Output:'));
        outputPanel = element('div', '', 'master-output');
        content.append(outputPanel);
        refreshOutput();
        content.append(element('h3', 'Your inventory'));
        inventoryPanel = element('div', '', 'master-player-inventory');
        inventoryPanel.append(createInventoryGrid(player.inventory, interaction, refreshTransfers, output));
        content.append(inventoryPanel, element('h2', 'Workers'));
        purchaseButtons = [];
        shopBalance = element('p', '', 'worker-shop-balance');
        const tabs = element('nav', '', 'worker-tabs');
        tabs.setAttribute('aria-label', 'Worker sections');
        content.append(tabs, shopBalance);
        const ordered = [...workerTiers].sort((a,b) => TIER_ORDER.indexOf(a.id) - TIER_ORDER.indexOf(b.id));
        const ownedSection = element('section', '', 'worker-section');
        const availableSection = element('section', '', 'worker-section');
        for (const [label, section] of [['Owned', ownedSection], ['Available', availableSection]]) {
            section.append(element('h3', label));
            const tab = element('button', label, 'worker-tab');
            tab.type = 'button';
            tab.addEventListener('click', () => section.scrollIntoView({ block: 'start' }));
            tabs.append(tab);
        }
        const ownedList = element('div', '', 'workers-list');
        const availableList = element('div', '', 'workers-list');
        for (const [index, tier] of ordered.entries()) {
            const owned = player.miners.filter(miner => miner.tier.id === tier.id);
            for (const [ownedIndex, miner] of owned.entries()) {
                const slot = element('button', '', 'inventory-slot worker-slot');
                slot.type = 'button';
                const label = owned.length > 1 ? `${tier.name} #${ownedIndex + 1}` : tier.name;
                slot.append(element('span', 'Owned', 'worker-tier worker-owned-label'), createWorkerIcon(tier, index), element('span', label, 'worker-name'));
                slot.addEventListener('click', () => {
                    interaction.cancel();
                    refreshCursor();
                    showDetails(content, tier, miner);
                    gui.dialog.scrollTop = 0;
                });
                ownedList.append(slot);
            }
            if (owned.length) continue;
            const card = element('div', '', 'inventory-slot worker-slot worker-unowned');
            card.append(element('span', tier.name, 'worker-name'));
            const picture = element('div', '', 'worker-buy-picture');
            picture.append(createWorkerIcon(tier, index));
            const buy = element('button', `Buy ($${tier.cost.toLocaleString()})`, 'worker-buy-button');
            buy.type = 'button';
            buy.dataset.workerId = tier.id;
            buy.setAttribute('aria-label', `Buy ${tier.name} for $${tier.cost.toLocaleString()}`);
            purchaseButtons.push({ button: buy, tier });
            buy.addEventListener('click', () => {
                if (!buyWorker(player, tier, gameState)) return;
                interaction.cancel();
                refreshCursor();
                const scroll = gui.dialog.scrollTop;
                showList(content);
                gui.dialog.scrollTop = scroll;
            });
            picture.append(buy);
            const stats = element('div', '', 'worker-buy-stats');
            stats.append(element('span', `Cycle time: ${tier.cycleSeconds}s`),
                element('span', `Max resources/cycle: ${tier.resourcesPerCycle}`));
            card.append(picture, stats);
            availableList.append(card);
        }
        ownedSection.append(ownedList);
        availableSection.append(availableList);
        if (!ownedList.childElementCount) ownedSection.append(element('p', 'No workers owned yet.'));
        if (!availableList.childElementCount) availableSection.append(element('p', 'All worker tiers owned.'));
        content.append(ownedSection, availableSection);
        refreshPurchases();
    }
    function refreshPurchases() {
        if (shopBalance) shopBalance.textContent = `Balance: $${gameState.balance.toFixed(2)}${ownsApartment(player) ? '' : ' · ' + APARTMENT_REQUIRED}`;
        for (const { button, tier } of purchaseButtons) {
            button.disabled = !ownsApartment(player) || gameState.balance < tier.cost || player.miners.some(miner => miner.tier.id === tier.id);
        }
    }
    gui.register('mining-house', {
        label: 'Mining workers',
        className: 'inventory-modal mining-house-modal',
        render: showList,
    });
    window.addEventListener('keydown', event => {
        if (event.code !== 'KeyR' || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)) return;
        if (gui.isOpen) {
            if (gui.active === 'mining-house') { event.preventDefault(); gui.close(); }
        } else if (house.canInteract(player)) { event.preventDefault(); gui.open('mining-house'); }
    });
    return () => {
        if (!gui.isOpen || gui.active !== 'mining-house') return;
        updateCountdown();
        refreshPurchases();
        if (outputPanel && signature !== JSON.stringify(player.miningOutput.storage)) refreshOutput();
    };
}
