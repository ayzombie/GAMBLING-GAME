import MiningHouse from './miningHouse.js';

export default class Apartment extends MiningHouse {
    constructor(x, y, size) {
        super(x, y, size);
        this.cost = 900;
        this.owned = false;
        this.showPurchasePrompt = true;
    }
    get hitbox() {
        const scale = this.size / 200;
        return { x: this.x + 24 * scale, y: this.y + 40 * scale,
            width: 155 * scale, height: 130 * scale };
    }

    drawPrompt(ctx, player) {
        if (!this.showPurchasePrompt || !this.canInteract(player)) return;
        ctx.save();
        const x = this.x + this.size / 2, y = this.hitbox.y - 22;
        ctx.fillStyle = '#29261fe6'; ctx.fillRect(x - 78, y - 14, 156, 28);
        ctx.fillStyle = '#fff5d6'; ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(this.owned ? 'Apartment · Owned' : `R · Buy ($${this.cost})`, x, y);
        ctx.restore();
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.size / 200, this.size / 200);

        // Warm brick front, shaded side, and a flat roof.
        ctx.fillStyle = '#c69378';
        ctx.fillRect(24,40,131,130);
        ctx.fillStyle = '#966952';
        ctx.beginPath();
        ctx.moveTo(155,40); ctx.lineTo(179,28);
        ctx.lineTo(179,158); ctx.lineTo(155,170);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#65717b';
        ctx.beginPath();
        ctx.moveTo(18,35); ctx.lineTo(43,22);
        ctx.lineTo(185,22); ctx.lineTo(160,35);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#414e59'; ctx.fillRect(18,35,142,8);
        ctx.strokeStyle = '#a9796038'; ctx.lineWidth = 1;
        for (let y = 51; y < 170; y += 12) {
            ctx.beginPath(); ctx.moveTo(26,y); ctx.lineTo(153,y); ctx.stroke();
        }

        // Six inset windows with lintels, reflections, and crossbars.
        for (const y of [54,92,130]) {
            for (const x of [39,115]) {
                ctx.fillStyle = '#755344'; ctx.fillRect(x-2,y-2,28,29);
                ctx.fillStyle = '#9ac6d5'; ctx.fillRect(x,y,24,24);
                ctx.fillStyle = '#c5e1e5'; ctx.fillRect(x+2,y+2,8,9);
                ctx.fillStyle = '#f0d9b7';
                ctx.fillRect(x+11,y,2,24); ctx.fillRect(x,y+11,24,2);
                ctx.fillRect(x-4,y+25,32,4);
            }
        }
        ctx.fillStyle = '#3d4d53'; ctx.fillRect(66,109,48,13);
        ctx.fillStyle = '#fff0d5'; ctx.font = 'bold 8px Arial'; ctx.textAlign = 'center';
        ctx.fillText('APARTMENT',90,118);
        ctx.restore();
    }
}
