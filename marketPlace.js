import MiningHouse from './miningHouse.js';

export default class MarketPlace extends MiningHouse {
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x,this.y);
        ctx.scale(this.size/200,this.size/200);
        ctx.fillStyle='#87603c';
        ctx.fillRect(24,65,10,105);ctx.fillRect(166,65,10,105);
        ctx.fillStyle='#bd925d';ctx.fillRect(24,118,152,52);
        ctx.fillStyle='#e1bb80';ctx.fillRect(18,116,164,12);
        for(let i=0;i<6;i++) {
            ctx.fillStyle=i%2?'#f2e2bb':'#c26147';
            ctx.beginPath();ctx.moveTo(22+i*26,36);ctx.lineTo(48+i*26,36);
            ctx.lineTo(52+i*26,77);ctx.lineTo(26+i*26,77);ctx.closePath();ctx.fill();
            ctx.fillRect(26+i*26,77,26,13);
        }
        ctx.fillStyle='#654d34';ctx.fillRect(47,10,110,24);
        ctx.fillStyle='#fff0bc';ctx.font='bold 17px Arial';ctx.textAlign='center';
        ctx.fillText('MARKET',102,28);
        for(const [x,color] of [[50,'#c47b4b'],[89,'#e9ba3b'],[128,'#76d4de']]) {
            ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,110);ctx.lineTo(x+8,94);ctx.lineTo(x+22,98);ctx.lineTo(x+26,110);ctx.closePath();ctx.fill();
        }
        ctx.restore();
    }

    drawPrompt(ctx,player) {
        if(!this.canInteract(player)) return;
        ctx.save();
        const x=this.x+this.size/2,y=this.y+this.size+15;
        ctx.fillStyle='#29261fe6';ctx.fillRect(x-48,y-13,96,26);
        ctx.fillStyle='#fff5d6';ctx.font='bold 13px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText('R · Market',x,y);ctx.restore();
    }
}
