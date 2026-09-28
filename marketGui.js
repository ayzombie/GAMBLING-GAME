import { resourcePrices, gameState, marketHistory } from './gameData.js';
import { createItemIcon, itemCountLabel } from './items.js';
import { countMaterial, sellMaterial } from './market.js';
import { MarketChart, marketTime } from './marketChart.js';
import { historyStats, changeText } from './marketStats.js';

export function setupMarketGui(gui, market, player) {
    const node=(tag,text,className='')=>{const el=document.createElement(tag);el.textContent=text;el.className=className;return el;};
    let selected=null,chart=null,priceLabel,changeLabel,holdings,sellOne,sellAll,lastLength=0;
    let highLabel,lowLabel,startLabel,inventoryPanel;
    function refreshInventory() {
        if (!inventoryPanel) return;
        inventoryPanel.replaceChildren();
        for (const stack of player.inventory.slots) {
            const slot = node('div', '', 'inventory-slot');
            slot.title = stack ? `${stack.type}: ${itemCountLabel(stack)}` : 'Empty slot';
            slot.setAttribute('role', 'img'); slot.setAttribute('aria-label', slot.title);
            if (stack) {
                slot.append(createItemIcon(stack.type));
                if (stack.count > 1 || stack.type === 'Money') {
                    const count = node('span', itemCountLabel(stack), 'inventory-count');
                    if (stack.type === 'Money') { count.dataset.moneyAmount = ''; slot.dataset.moneySlot = ''; }
                    slot.append(count);
                }
            }
            inventoryPanel.append(slot);
        }
    }
    function appendInventory(content) {
        const section = node('section', '', 'market-inventory');
        section.append(node('h3', 'Your inventory'));
        inventoryPanel = node('div', '', 'inventory-grid');
        section.append(inventoryPanel); content.append(section); refreshInventory();
    }
    player.inventory.listeners.add(() => {
        if (gui.isOpen && gui.active === 'market') refreshInventory();
    });
    function cleanup(){chart?.destroy();chart=null;selected=null;inventoryPanel=null;}
    gui.dialog.addEventListener('close',cleanup);
    function update() {
        if(!gui.isOpen||gui.active!=='market'||!selected)return;
        const history=marketHistory[selected];
        const current=resourcePrices[selected];
        const previous=history.length>1?history.at(-2).price:current;
        const change=Math.round((current-previous)*100)/100;
        const owned=countMaterial(player.inventory,selected);
        priceLabel.textContent=`$${current.toFixed(2)}`;
        changeLabel.textContent=`${change>0?'▲':change<0?'▼':'—'} ${change>=0?'+':'−'}$${Math.abs(change).toFixed(2)} (${(Math.abs(change)/previous*100).toFixed(2)}%) · ${marketTime(history.at(-1).minute)}`;
        changeLabel.dataset.direction=change>0?'up':change<0?'down':'flat';
        holdings.textContent=`Owned: ${owned} · Balance: $${gameState.balance.toFixed(2)}`;
        sellOne.disabled=owned<1;sellAll.disabled=owned<1;
        if(history.length!==lastLength){
            lastLength=history.length;
            const stats=historyStats(history);
            highLabel.textContent=`$${stats.high.toFixed(2)}`;
            lowLabel.textContent=`$${stats.low.toFixed(2)}`;
            startLabel.textContent=changeText(stats);
            chart.update();
        }
    }
    function details(content,type) {
        gui.setBack(() => render(content));
        cleanup();selected=type;lastLength=0;
        content.replaceChildren();
        const header=node('div','','market-detail-header');
        header.append(createItemIcon(type),node('h2',type));
        priceLabel=node('div','','market-current-price');changeLabel=node('p','','market-price-change');
        holdings=node('p','','market-holdings');
        const summary=node('div','','market-summary');
        const primary=node('div','','market-summary-primary');
        primary.append(header,priceLabel,changeLabel);
        const stats=node('dl','','market-summary-stats');
        highLabel=node('dd','');lowLabel=node('dd','');startLabel=node('dd','');
        for(const [label,value] of [['All-time high',highLabel],['All-time low',lowLabel],['Change since start',startLabel]]) {
            const group=node('div','');group.append(node('dt',label),value);stats.append(group);
        }
        summary.append(primary,stats);
        const host=node('div','','market-chart');
        content.append(summary,host);
        chart=new MarketChart(host,marketHistory[type]);
        const actions=node('div','','market-actions');
        sellAll=node('button','Sell all');sellOne=node('button','Sell 1');const back=node('button','← Back');
        sellAll.addEventListener('click',()=>{sellMaterial(player.inventory,type,countMaterial(player.inventory,type));update();});
        sellOne.addEventListener('click',()=>{sellMaterial(player.inventory,type,1);update();});
        back.addEventListener('click',()=>gui.back());
        sellAll.dataset.sellMaterial=type;sellOne.dataset.sellMaterial=type;
        actions.append(sellAll,sellOne,back);
        content.append(actions,holdings);
        appendInventory(content);
        gui.dialog.scrollTop=0;
        update();
    }
    function render(content) {
        gui.setBack();
        cleanup();content.replaceChildren();
        const list=node('div','','market-list');
        for(const type of Object.keys(resourcePrices)) {
            const row=node('button','','market-item');row.type='button';row.dataset.material=type;
            row.append(createItemIcon(type),node('span',type));
            row.addEventListener('click',()=>details(content,type));list.append(row);
        }
        content.append(list);
        appendInventory(content);
    }
    gui.register('market',{label:'Market',className:'inventory-modal market-modal',render});
    window.addEventListener('keydown',event=>{
        if(event.code!=='KeyR'||event.repeat||event.ctrlKey||event.metaKey||event.altKey) return;
        if(event.target?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(event.target?.tagName)) return;
        if(gui.isOpen) {
            if(gui.active==='market'){event.preventDefault();gui.close();}
        } else if(market.canInteract(player)){event.preventDefault();gui.open('market');}
    });
    return update;
}
