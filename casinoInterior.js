function box(ctx, x, y, width, height, color, radius = 12) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x,y,width,height,radius); ctx.fill();
}
function label(ctx, text, x, y, color = '#ffe4ac', size = 24) {
    ctx.fillStyle = color; ctx.font = `bold ${size}px Arial`; ctx.textAlign = 'center'; ctx.fillText(text,x,y);
}

export default class CasinoInterior {
    constructor(width, height) {
        this.width = width; this.height = height;
        this.spawn = { x: width/2, y: height-220 };
        this.exit = { x: width/2, y: height-100 };
        this.props = [];
        for (let row=0;row<2;row++) for (let col=0;col<5;col++) {
            this.props.push({kind:'slot',x:170+col*94,y:310+row*160,width:66,height:92});
        }
        for (const [kind,x,y] of [['roulette',width-530,360],['dice',width-530,820],
            ['crash',width/2-110,650],['coin',230,830],['stopwatch',width/2-110,260]]) {
            this.props.push({kind,x,y,width:220,height:130});
        }
        for (const x of [230,width-470]) {
            this.props.push({kind:'sofa',x,y:height-470,width:240,height:85});
        }
        for (const x of [95,width-145]) for (const y of [200,650,1100,height-220]) {
            this.props.push({kind:'plant',x,y,width:50,height:50});
        }
    }
    canPlayCoinFlip(player) { return this.canPlayTable(player, 'coin'); }
    canPlayStopwatch(player) { return this.canPlayTable(player, 'stopwatch'); }
    canPlayTable(player, kind) {
        const table = this.props.find(prop => prop.kind === kind);
        const x = Math.max(table.x, Math.min(table.x + table.width, player.x));
        const y = Math.max(table.y, Math.min(table.y + table.height, player.y + 10));
        return Math.hypot(player.x - x, player.y + 10 - y) <= 65;
    }
    canExit(player) { return Math.hypot(player.x-this.exit.x,player.y-this.exit.y) <= 100; }
    blocked(x,y) {
        return this.props.some(p => x+15>p.x && x-15<p.x+p.width && y+23>p.y && y-5<p.y+p.height);
    }
    movePlayer(player, dx, dy) {
        const steps = Math.max(1,Math.ceil(Math.hypot(dx,dy)/2));
        for(let i=0;i<steps;i++) {
            const x=Math.max(65,Math.min(this.width-65,player.x+dx/steps));
            if(!this.blocked(x,player.y))player.x=x;
            const y=Math.max(145,Math.min(this.height-65,player.y+dy/steps));
            if(!this.blocked(player.x,y))player.y=y;
        }
    }
    drawProp(ctx,p) {
        box(ctx,p.x+5,p.y+8,p.width,p.height,'#07081766');
        if(p.kind==='slot') {
            box(ctx,p.x,p.y,p.width,p.height,'#39304e',7);
            box(ctx,p.x+4,p.y+4,p.width-8,10,'#ed75c3',3);
            box(ctx,p.x+7,p.y+22,p.width-14,38,'#0c2035',3);
            label(ctx,'7 7 7',p.x+p.width/2,p.y+48,'#ffe79e',17);
            box(ctx,p.x+8,p.y+68,p.width-16,14,'#605071',3);
            ctx.fillStyle='#70e8df';ctx.beginPath();ctx.arc(p.x+45,p.y+75,4,0,Math.PI*2);ctx.fill();
        } else if(p.kind==='plant') {
            box(ctx,p.x+9,p.y+20,32,30,'#ae864e',5);
            for(let i=0;i<5;i++) {
                ctx.fillStyle=i%2?'#397d72':'#62a98d';ctx.beginPath();
                ctx.ellipse(p.x+25+Math.cos(i*1.3)*14,p.y+14+Math.sin(i*1.3)*12,12,21,i*.8,0,Math.PI*2);ctx.fill();
            }
        } else if(p.kind==='sofa') {
            box(ctx,p.x,p.y,p.width,p.height,'#5b2d66',16);
            box(ctx,p.x+12,p.y+20,p.width-24,p.height-30,'#945184',10);
            ctx.strokeStyle='#d492ae';ctx.lineWidth=2;
            for(let x=p.x+75;x<p.x+p.width-10;x+=75){ctx.beginPath();ctx.moveTo(x,p.y+25);ctx.lineTo(x,p.y+p.height-16);ctx.stroke();}
        } else {
            box(ctx,p.x,p.y,p.width,p.height,'#bb8d4d',45);
            box(ctx,p.x+9,p.y+9,p.width-18,p.height-18,p.kind==='dice'?'#254e67':'#235f59',40);
            ctx.strokeStyle='#d5c79a';ctx.lineWidth=2;ctx.strokeRect(p.x+36,p.y+29,p.width-72,p.height-58);
            if(p.kind==='roulette') {
                const x=p.x+110,y=p.y+65;
                for(let i=0;i<12;i++){ctx.fillStyle=i%2?'#e25e72':'#26323d';ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,40,i*Math.PI/6,(i+1)*Math.PI/6);ctx.closePath();ctx.fill();}
                ctx.fillStyle='#ecc97a';ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.fill();
            } else label(ctx,p.kind==='dice'?'⚄  ⚂':p.kind==='coin'?'◉':p.kind==='crash'?'↗ CRASH':'00:00',p.x+110,p.y+77,'#f2de99',32);
        }
    }
    draw(ctx, viewWidth, viewHeight, player, world) {
        ctx.fillStyle='#171326';ctx.fillRect(0,0,viewWidth,viewHeight);
        ctx.save();ctx.scale(world.scale,world.scale);ctx.translate(-world.cameraX,-world.cameraY);
        const w=this.width,h=this.height;
        ctx.fillStyle='#392347';ctx.fillRect(40,100,w-80,h-140);
        // Diamond carpet, brass trim, and a turquoise central promenade.
        for(let x=80;x<w-40;x+=90) for(let y=155;y<h-40;y+=90) {
            ctx.strokeStyle=((x+y)/90)%2?'#70405d':'#5e395b';ctx.lineWidth=1;
            ctx.beginPath();ctx.moveTo(x,y-12);ctx.lineTo(x+12,y);ctx.lineTo(x,y+12);ctx.lineTo(x-12,y);ctx.closePath();ctx.stroke();
        }
        box(ctx,w/2-115,180,230,h-245,'#1d414a',32);
        ctx.strokeStyle='#ceab62';ctx.lineWidth=3;
        ctx.strokeRect(62,122,w-124,h-190);
        for(const x of [w/2-108,w/2+108]){ctx.beginPath();ctx.moveTo(x,450);ctx.lineTo(x,h-115);ctx.stroke();}
        for(const [x,y,width,height,color] of [[135,265,520,410,'#ab5191'],[w-600,265,380,310,'#4dc6c1'],[155,760,450,310,'#cdb165'],[w-600,750,380,310,'#689cdd']]) {
            ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(x,y,width,height,24);ctx.stroke();
        }
        label(ctx,'SLOTS',395,240,'#f4a2d7');label(ctx,'ROULETTE',w-410,240,'#7aefe4');
        label(ctx,'COIN FLIP',380,735);label(ctx,'DICE',w-410,725,'#9bbfff');
        label(ctx,'STOPWATCH',w/2,235,'#a6f4f1',20);
        label(ctx,'THE LOUNGE',w/2,h-460,'#dca9dd',22);
        // Central floor medallion leaves an open walking route through the room.
        ctx.strokeStyle='#b28b60';ctx.lineWidth=4;ctx.beginPath();ctx.arc(w/2,h/2,83,0,Math.PI*2);ctx.stroke();
        label(ctx,'♦',w/2,h/2+22,'#dfc380',64);
        ctx.fillStyle='#211b32';ctx.fillRect(32,35,w-64,82);
        ctx.fillStyle='#e686c9';ctx.fillRect(42,110,w-84,4);
        ctx.shadowColor='#df65c2';ctx.shadowBlur=18;label(ctx,'THE GRAND CASINO',w/2,89,'#ffe5ac',38);ctx.shadowBlur=0;
        for(let x=100;x<w-70;x+=100){ctx.fillStyle='#efcc8d';ctx.beginPath();ctx.arc(x,130,4,0,Math.PI*2);ctx.fill();}
        box(ctx,this.exit.x-100,h-125,200,70,'#132d37',10);
        ctx.strokeStyle='#6be7d5';ctx.lineWidth=3;ctx.strokeRect(this.exit.x-95,h-120,190,60);
        label(ctx,'EXIT ↓',this.exit.x,h-80,'#9cf8df',24);
        const actors=this.props.map(p=>({depth:p.y+p.height,draw:()=>this.drawProp(ctx,p)}));
        actors.push({depth:player.y+13,draw:()=>player.draw(ctx)});actors.sort((a,b)=>a.depth-b.depth);
        for(const actor of actors)actor.draw();
        if (this.canPlayCoinFlip(player)) {
            const table = this.props.find(prop => prop.kind === 'coin');
            box(ctx,table.x+10,table.y+table.height+22,200,34,'#151728ed',8);
            label(ctx,'R · Coin Flip · $25 min',table.x+110,table.y+table.height+45,'#fff2be',14);
        }
        if (this.canPlayStopwatch(player)) {
            const table = this.props.find(prop => prop.kind === 'stopwatch');
            box(ctx,table.x+10,table.y+table.height+22,200,34,'#151728ed',8);
            label(ctx,'R · Stopwatch',table.x+110,table.y+table.height+45,'#fff2be',14);
        }
        if (this.canPlayTable(player,'crash')) {
            const table=this.props.find(prop=>prop.kind==='crash');
            box(ctx,table.x+10,table.y+table.height+22,200,34,'#151728ed',8);
            label(ctx,'R · Crash · $100 min',table.x+110,table.y+table.height+45,'#fff2be',14);
        }
        if(this.canExit(player)) {
            box(ctx,this.exit.x-90,h-190,180,34,'#151728ed',8);
            label(ctx,'R · Return outside',this.exit.x,h-167,'#fff2be',15);
        }
        ctx.restore();
    }
}
