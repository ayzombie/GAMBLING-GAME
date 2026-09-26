import Resource from './resource.js';
import { resourcePrices } from './gameData.js';

// Shared collectible definitions for future world pickups and inventory slots.
export const items = Object.fromEntries(Object.entries(resourcePrices).map(([type, value]) => [
    type, Object.freeze({ type, name: type, get value() { return resourcePrices[type]; }, maxStack: 64 }),
]));

items.Radio = Object.freeze({ type: 'Radio', name: 'Radio', value: 0, maxStack: 1, category: 'equipment' });

export function createItemIcon(type) {
    if (!Object.hasOwn(items, type)) throw new Error(`Unknown material: ${type}`);
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    canvas.className = 'inventory-icon';
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');
    if (type === 'Radio') {
        ctx.strokeStyle = '#c6d4dc'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(43,20); ctx.lineTo(53,3); ctx.stroke();
        ctx.fillStyle = '#253e41'; ctx.fillRect(5,19,54,39);
        ctx.fillStyle = '#5c7971'; ctx.fillRect(7,21,50,32);
        ctx.fillStyle = '#1d3036'; ctx.fillRect(12,29,23,20);
        ctx.strokeStyle = '#859b91'; ctx.lineWidth = 1;
        for (let y=32;y<49;y+=4) { ctx.beginPath(); ctx.moveTo(14,y); ctx.lineTo(33,y); ctx.stroke(); }
        ctx.fillStyle = '#f0d28a'; ctx.fillRect(40,27,12,7);
        ctx.fillStyle = '#d5d6c0'; ctx.beginPath(); ctx.arc(46,43,5,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = '#abc3b1'; ctx.fillRect(10,21,44,3);
    } else new Resource(4, 4, 56, 56, 'gray', type).draw(ctx);
    return canvas;
}
