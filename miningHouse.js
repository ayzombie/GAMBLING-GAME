function polygon(ctx, points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    ctx.fill();
}

export default class MiningHouse {
    constructor(x, y, size = 190) {
        this.x = x;
        this.y = y;
        this.size = size;
    }

    get hitbox() {
        const scale = this.size / 200;
        return { x: this.x + 24 * scale, y: this.y + 79 * scale,
            width: 155 * scale, height: 91 * scale };
    }

    distanceTo(x, y) {
        const box = this.hitbox;
        const nearestX = Math.max(box.x, Math.min(box.x + box.width, x));
        const nearestY = Math.max(box.y, Math.min(box.y + box.height, y));
        return Math.hypot(x - nearestX, y - nearestY);
    }

    blocksPlayer(x, y) {
        return this.distanceTo(x, y + 10) < 10;
    }

    canInteract(player) {
        return this.distanceTo(player.x, player.y + 10) <= 55;
    }

    drawPrompt(ctx, player) {
        if (!this.canInteract(player)) return;
        ctx.save();
        const x = this.x + this.size * 0.44;
        const y = this.y + this.size + 15;
        ctx.fillStyle = '#29261fe6';
        ctx.fillRect(x - 60, y - 13, 120, 26);
        ctx.fillStyle = '#fff5d6';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('R · Mining house', x, y);
        ctx.restore();
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.size / 200, this.size / 200);
        // Warm stone walls, timber trim, and a shaded slate roof.
        ctx.fillStyle = '#dbccad';
        ctx.fillRect(24,79,128,91);
        polygon(ctx, [[152,79],[179,61],[179,151],[152,170]], '#a49377');
        for (let row = 0; row < 4; row++) {
            ctx.strokeStyle = '#b6a78d';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(27,95+row*19);
            ctx.lineTo(150,95+row*19);
            for (let x = 30+(row%2)*19; x < 150; x += 38) {
                ctx.moveTo(x,79+row*19);
                ctx.lineTo(x,95+row*19);
            }
            ctx.stroke();
        }
        ctx.fillStyle = '#8b7760';
        ctx.fillRect(135,25,15,39);
        ctx.fillStyle = '#b8a487';
        ctx.fillRect(131,22,23,8);
        polygon(ctx, [[10,84],[82,24],[164,84]], '#546976');
        polygon(ctx, [[82,24],[110,8],[191,64],[164,84]], '#384a56');
        polygon(ctx, [[10,84],[164,84],[164,91],[10,91]], '#6b5038');
        ctx.strokeStyle = '#82939a';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(36-i*9,62+i*9);
            ctx.lineTo(133+i*12,62+i*9);
            ctx.stroke();
        }
        ctx.fillStyle = '#735036';
        ctx.fillRect(70,122,36,48);
        ctx.fillStyle = '#a17b4b';
        ctx.fillRect(75,127,26,43);
        ctx.fillStyle = '#eed896';
        ctx.fillRect(96,149,4,4);
        for (const x of [35,119]) {
            ctx.fillStyle = '#765b40';
            ctx.fillRect(x,112,22,27);
            ctx.fillStyle = '#aad6df';
            ctx.fillRect(x+3,115,16,21);
            ctx.fillStyle = '#f0e2bd';
            ctx.fillRect(x+10,115,2,21);
            ctx.fillRect(x+3,125,16,2);
        }
        ctx.fillStyle = '#a99d83';
        ctx.fillRect(64,170,48,7);
        ctx.fillStyle = '#d6c9a8';
        ctx.fillRect(64,170,48,3);
        // Crossed pickaxes on a dark plaque above the doorway.
        ctx.fillStyle = '#403b32';
        ctx.fillRect(65,85,46,31);
        ctx.strokeStyle = '#d5b773';
        ctx.lineWidth = 2;
        ctx.strokeRect(65,85,46,31);
        for (const mirror of [1,-1]) {
            ctx.save();
            ctx.translate(88,101);
            ctx.scale(mirror,1);
            ctx.strokeStyle = '#c69a5b';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-10,10);
            ctx.lineTo(7,-8);
            ctx.stroke();
            ctx.strokeStyle = '#e4edf0';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-1,-12);
            ctx.quadraticCurveTo(9,-12,14,-2);
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }
}
