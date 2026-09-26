import { oilDurations } from './gameData.js';

export function chooseOilDuration(random = Math.random) {
    const roll = random();
    let cumulative = 0;
    const { minimum, maximum } = oilDurations.find(tier => {
        cumulative += tier.chance;
        return roll < cumulative;
    }) ?? oilDurations[oilDurations.length - 1];
    return minimum + random() * (maximum - minimum);
}

export default class OilLeak {
    constructor(x, floorY, width, now) {
        this.type = 'Oil';
        this.x = x;
        this.y = 460;
        this.floorY = floorY;
        this.width = width;
        this.height = floorY - this.y;
        this.startedAt = now;
        this.duration = chooseOilDuration();
        this.age = 0;
        this.expired = false;
    }

    update(now) {
        this.age = Math.max(0, (now - this.startedAt) / 1000);
        this.expired = this.age >= this.duration;
    }

    draw(ctx) {
        if (this.expired) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = Math.min(1, this.age / 0.2, Math.max(0, (this.duration - this.age) / 0.5));
        const middle = this.width / 2;
        // A dark crack marks where the liquid emerges from the rock wall.
        ctx.strokeStyle = '#221b17';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(middle-15,-14);
        ctx.lineTo(middle-4,-6);
        ctx.lineTo(middle+3,-10);
        ctx.lineTo(middle,0);
        ctx.lineTo(middle+12,7);
        ctx.stroke();
        const length = this.height * Math.min(1, this.age / 0.65);
        ctx.lineCap = 'round';
        // Several uneven brown-black rivulets running down the wall.
        for (let i = 0; i < 3; i++) {
            const offset = (i-1) * 6;
            const sway = Math.sin(this.age * 3 + i) * 2;
            ctx.strokeStyle = i === 1 ? '#251c15' : '#39291c';
            ctx.lineWidth = i === 1 ? 9 : 4;
            ctx.beginPath();
            ctx.moveTo(middle+offset,0);
            ctx.bezierCurveTo(middle-5+offset,length*0.3,middle+offset+sway,length*0.7,middle+offset,length);
            ctx.stroke();
        }
        ctx.strokeStyle = '#6b4a2d70';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(middle-2,6);
        ctx.lineTo(middle-3,length);
        ctx.stroke();
        // Moving beads keep the leak visibly flowing.
        for (let i = 0; i < 4; i++) {
            const progress = (this.age * 1.2 + i / 4) % 1;
            ctx.fillStyle = '#171310';
            ctx.beginPath();
            ctx.ellipse(middle+Math.sin(i*3)*5, progress*length, 3, 6, 0, 0, Math.PI*2);
            ctx.fill();
        }
        if (this.age > 0.65) {
            const growth = Math.min(1, (this.age - 0.65) / 1.2);
            ctx.fillStyle = '#241b15';
            ctx.beginPath();
            ctx.ellipse(middle,this.height,this.width*(0.25+growth*0.4),5+growth*6,0,0,Math.PI*2);
            ctx.fill();
            ctx.strokeStyle = '#78523366';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(middle,this.height,this.width*(0.12+((this.age*0.8)%1)*0.35),3+((this.age*0.8)%1)*4,0,0,Math.PI*2);
            ctx.stroke();
        }
        ctx.restore();
    }
}
