import MiningHouse from './miningHouse.js';

export default class Casino extends MiningHouse {
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y); ctx.scale(this.size / 200, this.size / 200);
        ctx.fillStyle = '#32233f'; ctx.fillRect(24,79,155,91);
        ctx.fillStyle = '#20192e'; ctx.fillRect(157,79,22,91);
        ctx.fillStyle = '#75505f'; ctx.fillRect(19,168,165,9);
        ctx.fillStyle = '#20172f'; ctx.fillRect(12,41,177,46);
        ctx.strokeStyle = '#f5c666'; ctx.lineWidth = 3; ctx.strokeRect(12,41,177,46);
        ctx.fillStyle = '#ed67b6'; ctx.fillRect(20,91,163,4);
        for (const x of [29,143]) {
            ctx.fillStyle = '#c9a66f'; ctx.fillRect(x,96,19,72);
            ctx.fillStyle = '#fae4a2'; ctx.fillRect(x,96,5,72);
            ctx.fillRect(x-3,97,25,6); ctx.fillRect(x-3,161,25,7);
        }
        ctx.fillStyle = '#111a31'; ctx.fillRect(66,111,65,59);
        ctx.strokeStyle = '#6eeee9'; ctx.lineWidth = 2; ctx.strokeRect(66,111,65,59);
        ctx.fillStyle = '#34445c'; ctx.fillRect(70,115,25,49); ctx.fillRect(101,115,25,49);
        ctx.fillStyle = '#f4d68b'; ctx.fillRect(91,142,3,12); ctx.fillRect(102,142,3,12);
        ctx.shadowColor = '#f76abf'; ctx.shadowBlur = 13;
        ctx.fillStyle = '#fff1c9'; ctx.font = 'bold 25px Arial'; ctx.textAlign = 'center';
        ctx.fillText('CASINO',100,73); ctx.shadowBlur = 0;
        for (let x=21;x<188;x+=13) {
            ctx.fillStyle = x % 2 ? '#ffe3a3' : '#fff6dc';
            ctx.beginPath(); ctx.arc(x,35,2.7,0,Math.PI*2); ctx.fill();
        }
        ctx.fillStyle = '#e7c576'; ctx.font = '22px serif'; ctx.fillText('♦  ♠  ♥',100,27);
        ctx.restore();
    }
    drawPrompt(ctx, player) {
        if (!this.canInteract(player)) return;
        ctx.save();
        const x = this.x + this.size/2, y = this.y + this.size * .96;
        ctx.fillStyle = '#21172fed'; ctx.fillRect(x-68,y-15,136,30);
        ctx.fillStyle = '#ffe8a5'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
        ctx.fillText('R · Enter casino',x,y+5); ctx.restore();
    }
}
