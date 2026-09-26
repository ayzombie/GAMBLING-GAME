function polygon(ctx, points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach(([x, y], index) => index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.closePath();
    ctx.fill();
}

function oval(ctx, x, y, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
}

export default class Resource {
    constructor(x, y, width, height, color, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.type = type;
    }

    draw(ctx) {
        ctx.save();
        oval(ctx, this.x + this.width * 0.52, this.y + this.height * 0.89,
            this.width * 0.43, this.height * 0.08, 'rgba(25, 35, 30, 0.18)');
        ctx.translate(this.x, this.y);
        ctx.scale(this.width / 100, this.height / 100);

        switch (this.type) {
            case 'Dirt':
                polygon(ctx, [[7,82],[19,53],[42,34],[66,41],[89,67],[94,86]], '#89603f');
                polygon(ctx, [[7,82],[19,53],[42,34],[66,41],[44,53],[30,79]], '#a77c51');
                polygon(ctx, [[66,41],[89,67],[94,86],[65,84],[73,65]], '#735038');
                for (const [x, y, radius] of [[25,65,4],[48,58,3],[61,74,5],[37,79,3],[78,72,3]]) {
                    oval(ctx, x, y, radius, radius * 0.6, '#c29a6b');
                }
                break;
            case 'Wood':
                polygon(ctx, [[14,27],[73,19],[88,34],[88,70],[73,84],[14,78]], '#82512f');
                polygon(ctx, [[14,27],[73,19],[88,34],[28,43]], '#b47d46');
                ctx.strokeStyle = '#603d2a';
                ctx.lineWidth = 3;
                for (const y of [45,59,71]) {
                    ctx.beginPath();
                    ctx.moveTo(28,y);
                    ctx.lineTo(75,y-7);
                    ctx.stroke();
                }
                oval(ctx, 23, 54, 18, 28, '#d7ad70');
                ctx.strokeStyle = '#a47743';
                for (const radius of [7,13]) {
                    ctx.beginPath();
                    ctx.ellipse(23,54,radius,radius*1.5,0,0,Math.PI*2);
                    ctx.stroke();
                }
                break;
            case 'Stone':
                polygon(ctx, [[8,69],[21,32],[48,18],[78,29],[94,64],[83,87],[26,89]], '#7d8587');
                polygon(ctx, [[8,69],[21,32],[48,18],[78,29],[51,45],[25,48]], '#a1a8a6');
                polygon(ctx, [[51,45],[78,29],[94,64],[83,87],[63,72]], '#656e74');
                break;
            case 'Copper':
                // An irregular cluster of copper nuggets.
                for (const [x,y,r] of [[30,66,25],[65,63,29],[48,36,22]]) {
                    polygon(ctx, [[x-r,y],[x-r*0.6,y-r],[x+r*0.5,y-r*0.8],[x+r,y],[x+r*0.6,y+r*0.7],[x-r*0.5,y+r]], '#ad653d');
                    polygon(ctx, [[x-r,y],[x-r*0.6,y-r],[x+r*0.5,y-r*0.8],[x,y+2]], '#e4a477');
                }
                break;
            case 'Iron':
                // A chunky, angular metal block.
                polygon(ctx, [[12,40],[62,18],[88,36],[88,75],[38,91],[12,72]], '#88929b');
                polygon(ctx, [[12,40],[62,18],[88,36],[38,57]], '#c8d0d4');
                polygon(ctx, [[38,57],[88,36],[88,75],[38,91]], '#5f6d7a');
                polygon(ctx, [[18,46],[29,51],[29,72],[18,66]], '#aeb9bd');
                break;
            case 'Gold':
                // A broad, lumpy gold nugget.
                polygon(ctx, [[9,68],[20,44],[37,40],[47,24],[66,29],[72,44],[87,47],[94,71],[77,88],[28,91]], '#d5a129');
                polygon(ctx, [[9,68],[20,44],[37,40],[47,24],[66,29],[55,47],[31,60]], '#ffe28b');
                polygon(ctx, [[55,47],[72,44],[87,47],[94,71],[77,88],[65,68]], '#b77a1a');
                polygon(ctx, [[31,60],[55,47],[65,68],[45,77]], '#efc44e');
                break;
            case 'Titanium':
                // A narrow cluster of metallic crystal blades.
                polygon(ctx, [[15,79],[20,38],[32,26],[44,76],[38,90]], '#8097af');
                polygon(ctx, [[33,84],[43,13],[56,6],[68,78],[58,93]], '#a8c1d7');
                polygon(ctx, [[56,6],[68,78],[58,93],[53,37]], '#597189');
                polygon(ctx, [[63,85],[71,36],[83,24],[90,76],[82,91]], '#748ba4');
                polygon(ctx, [[71,36],[83,24],[78,69],[63,85]], '#d1e1ed');
                break;
            case 'Rubber':
                // A hollow rubber ring; the hole keeps the scenery visible.
                ctx.strokeStyle = '#30363b';
                ctx.lineWidth = 20;
                ctx.beginPath();
                ctx.ellipse(50,53,29,30,0,0,Math.PI*2);
                ctx.stroke();
                ctx.strokeStyle = '#505960';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.ellipse(50,53,31,32,0,Math.PI,Math.PI*1.8);
                ctx.stroke();
                ctx.strokeStyle = '#20262a';
                ctx.lineWidth = 3;
                for (let i = 0; i < 10; i++) {
                    const angle = i / 10 * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(50+Math.cos(angle)*30,53+Math.sin(angle)*31);
                    ctx.lineTo(50+Math.cos(angle+0.08)*37,53+Math.sin(angle+0.08)*38);
                    ctx.stroke();
                }
                break;
            case 'Ruby':
                // Emerald cut: an elongated rectangle with clipped corners.
                polygon(ctx, [[32,8],[68,8],[83,24],[83,76],[68,92],[32,92],[17,76],[17,24]], '#9d2348');
                polygon(ctx, [[32,8],[68,8],[62,24],[38,24],[17,24]], '#f59bb1');
                polygon(ctx, [[17,24],[38,24],[31,34],[31,68],[17,76]], '#dc5c7d');
                polygon(ctx, [[68,8],[83,24],[83,76],[68,92],[62,75],[69,67],[69,33],[62,24]], '#771b3b');
                polygon(ctx, [[38,24],[62,24],[69,33],[69,67],[62,76],[38,76],[31,68],[31,34]], '#ce3a62');
                polygon(ctx, [[17,76],[31,68],[38,76],[62,76],[68,92],[32,92]], '#b42c53');
                polygon(ctx, [[38,28],[59,28],[38,61],[35,65],[35,35]], '#e975934d');
                break;
            case 'Diamond':
                // Tall cone silhouette: needle tip and a straight, flat base.
                polygon(ctx, [[50,4],[86,88],[14,88]], '#9bd5e8');
                polygon(ctx, [[50,4],[43,88],[14,88]], '#e7fbff');
                polygon(ctx, [[50,4],[86,88],[62,88]], '#5799ba');
                polygon(ctx, [[50,4],[62,88],[43,88]], '#bceaf4');
                break;
            case 'Oil': {
                const oil = ctx.createLinearGradient(20,20,80,85);
                oil.addColorStop(0, '#515968');
                oil.addColorStop(1, '#171e2b');
                ctx.fillStyle = oil;
                ctx.beginPath();
                ctx.moveTo(50,9);
                ctx.bezierCurveTo(43,30,17,47,19,65);
                ctx.bezierCurveTo(21,98,80,98,82,65);
                ctx.bezierCurveTo(83,46,59,29,50,9);
                ctx.fill();
                oval(ctx, 35, 59, 6, 13, '#8992a1');
                break;
            }
            default:
                ctx.fillStyle = this.color || '#888';
                ctx.fillRect(8,12,84,76);
                ctx.fillStyle = 'rgba(255,255,255,0.18)';
                ctx.fillRect(8,12,84,8);
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                ctx.fillRect(8,80,84,8);
        }
        ctx.restore();
    }
    static getRandomType(types, chances) {
        const total = chances.reduce((sum, chance) => sum + chance, 0);
        let roll = Math.random() * total;

        for (let i = 0; i < types.length; i++) {
            roll -= chances[i];
            if (roll < 0) return types[i];
        }

        return types[types.length - 1];
    }
}
