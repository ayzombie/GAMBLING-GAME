import { priceChange, changeText, pickChartSnapshot } from './marketStats.js';

export function marketTime(minute) {
    const whole = Math.floor(minute);
    return `D${Math.floor(whole/1440)+1} ${String(Math.floor(whole%1440/60)).padStart(2,'0')}:${String(whole%60).padStart(2,'0')}`;
}

export class MarketChart {
    constructor(host, history) {
        this.history = history;
        this.host = host;
        this.scroll = document.createElement('div');
        this.scroll.className = 'market-chart-scroll';
        this.scroll.tabIndex = 0;
        this.scroll.setAttribute('aria-label','Price history. Scroll horizontally to browse earlier prices.');
        this.track = document.createElement('div');
        this.track.className = 'market-chart-track';
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'market-chart-canvas';
        this.canvas.setAttribute('role','img');
        this.track.append(this.canvas);
        this.scroll.append(this.track);
        host.append(this.scroll);
        this.pointer = null;
        this.canvas.addEventListener('pointermove',event=>{
            const rect=this.canvas.getBoundingClientRect();
            this.pointer={x:(event.clientX-rect.left)*this.width/rect.width,y:(event.clientY-rect.top)*280/rect.height};
            this.draw();
        });
        this.canvas.addEventListener('pointerleave',()=>{this.pointer=null;this.draw();});
        this.scroll.addEventListener('scroll',()=>this.draw());
        this.scroll.addEventListener('wheel',event=>{
            if (event.ctrlKey || Math.abs(event.deltaX)>Math.abs(event.deltaY)) return;
            if (this.scroll.scrollWidth <= this.scroll.clientWidth) return;
            event.preventDefault();
            this.scroll.scrollLeft += event.deltaY;
        },{passive:false});
        this.observer = new ResizeObserver(()=>this.update());
        this.observer.observe(host);
        this.update();
    }
    destroy() { this.observer.disconnect(); }
    update() {
        const atEnd = this.scroll.scrollWidth-this.scroll.clientWidth-this.scroll.scrollLeft < 8;
        this.width = Math.max(220,this.host.clientWidth);
        this.track.style.width = `${Math.max(this.width,120+(this.history.at(-1).minute-this.history[0].minute)*2)}px`;
        this.canvas.style.width = `${this.width}px`;
        if (atEnd) this.scroll.scrollLeft = this.scroll.scrollWidth;
        this.draw();
    }
    draw() {
        const ctx = this.canvas.getContext('2d');
        const width = this.width, height = 280, offset = this.scroll.scrollLeft;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = Math.round(width*dpr);this.canvas.height=Math.round(height*dpr);
        ctx.scale(dpr,dpr);
        ctx.fillStyle='#182129';ctx.fillRect(0,0,width,height);
        const left=76,right=width-18,top=20,bottom=232;
        const x=point=>left+(point.minute-this.history[0].minute)*2-offset;
        let start=this.history.findIndex(point=>x(point)>=left);
        if(start<0)start=this.history.length-1;
        start=Math.max(0,start-1);
        let end=start;
        while(end<this.history.length-1 && x(this.history[end])<=right)end++;
        const visible=this.history.slice(start,end+1);
        let min=Math.min(...visible.map(p=>p.price)),max=Math.max(...visible.map(p=>p.price));
        const padding=Math.max((max-min)*0.15,0.02,max*0.0001);
        min=Math.max(0,min-padding);max+=padding;
        const y=price=>bottom-(price-min)/(max-min)*(bottom-top);
        ctx.font='12px Arial';ctx.textBaseline='middle';
        for(let i=0;i<=4;i++) {
            const price=min+(max-min)*i/4,py=y(price);
            ctx.strokeStyle='#ffffff15';ctx.beginPath();ctx.moveTo(left,py);ctx.lineTo(right,py);ctx.stroke();
            ctx.fillStyle='#afbdc7';ctx.textAlign='right';ctx.fillText(`$${price.toFixed(2)}`,left-8,py);
        }
        ctx.save();ctx.beginPath();ctx.rect(left,top,right-left,bottom-top);ctx.clip();
        ctx.strokeStyle='#65d9b4';ctx.lineWidth=2.5;ctx.beginPath();
        visible.forEach((point,i)=>{
            if(!i)ctx.moveTo(x(point),y(point.price));
            else {
                const previous=visible[i-1],mid=(x(previous)+x(point))/2;
                ctx.bezierCurveTo(mid,y(previous.price),mid,y(point.price),x(point),y(point.price));
            }
        });ctx.stroke();
        for(const point of visible){ctx.fillStyle='#b4f4df';ctx.beginPath();ctx.arc(x(point),y(point.price),3,0,Math.PI*2);ctx.fill();}
        ctx.restore();
        ctx.fillStyle='#afbdc7';ctx.textAlign='center';
        for(let px=left+40;px<right;px+=160)ctx.fillText(marketTime(this.history[0].minute+(px-left+offset)/2),px,254);
        ctx.textAlign='left';ctx.fillText('Price',8,10);
        if(this.history.length===1){ctx.fillStyle='#afbdc7';ctx.fillText('First snapshot — awaiting next update',left+12,top+18);}
        if(this.pointer && this.pointer.x>=left && this.pointer.x<=right && this.pointer.y>=top && this.pointer.y<=bottom) {
            const points=visible.map((point,i)=>({x:x(point),y:y(point.price),index:start+i}));
            const index=pickChartSnapshot(points,this.pointer);
            if(index!==null) {
                const point=this.history[index];
                const lines=[marketTime(point.minute),`Price: $${point.price.toFixed(2)}`,
                    index>0?changeText(priceChange(point.price,this.history[index-1].price)):'Starting price · no previous point'];
                const boxWidth=Math.min(215,width-12),boxHeight=62;
                const boxX=Math.max(6,Math.min(width-boxWidth-6,this.pointer.x+14));
                const boxY=Math.max(6,Math.min(height-boxHeight-6,this.pointer.y-boxHeight-10));
                ctx.save();
                ctx.beginPath();ctx.rect(left,top,right-left,bottom-top);ctx.clip();
                ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x(point),y(point.price),6,0,Math.PI*2);ctx.stroke();
                ctx.restore();
                ctx.fillStyle='#0c1219f2';ctx.fillRect(boxX,boxY,boxWidth,boxHeight);
                ctx.strokeStyle='#728596';ctx.lineWidth=1;ctx.strokeRect(boxX,boxY,boxWidth,boxHeight);
                ctx.font='11px Arial';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle='#f0f5fa';
                lines.forEach((line,i)=>ctx.fillText(line,boxX+8,boxY+13+i*17,boxWidth-16));
            }
        }
        this.canvas.setAttribute('aria-label',`Price history: ${this.history.length} snapshots. Visible range $${min.toFixed(2)} to $${max.toFixed(2)}.`);
    }
}
