import Crash, { crashConfig } from './games/crash.js';
import { gameState } from './gameData.js';
import { ownsApartment } from './playerAccess.js';

export function setupCrashGui(gui, world, player, seed) {
    const game = new Crash(seed, gameState, () => ownsApartment(player));
    let ring, marker, amount, status, wager, risk, cash, readSince = null, shownResult = null;
    const visible = () => gui.isOpen && gui.active === 'crash';
    const node = (tag,text,cls='') => { const el=document.createElement(tag); el.textContent=text; el.className=cls; return el; };
    gui.register('crash', {label:'Crash',className:'coin-modal crash-modal',render(content) {
        gui.setBack();
        const close=node('button','Close','coin-back'); close.addEventListener('click',()=>gui.close());
        content.append(close,node('h2','CRASH'),node('p','Keep your winnings—or risk the next spin. Minimum bet: $100.'));
        ring=node('div','','crash-ring'); marker=node('div','','crash-marker'); amount=node('strong','1×','crash-multiplier');
        ring.append(marker,amount); content.append(ring);
        const label=node('label','Wager ($)','coin-wager-label'); wager=node('input',''); wager.type='number'; wager.min='100'; wager.step='0.01'; wager.value=String(game.wagerCents ? game.wagerCents/100 : 100); label.append(wager);
        const controls=node('div','','crash-controls'); risk=node('button','Start','coin-flip-button'); cash=node('button','Cash out','coin-flip-button');
        risk.addEventListener('click',()=>{
            try { if(game.active) game.risk(); else {game.start(Number(wager.value)); readSince=null;} update(); }
            catch(error) {status.textContent=error.message;}
        });
        cash.addEventListener('click',()=>{game.cashOut();update();}); controls.append(risk,cash);
        status=node('p','','coin-result'); status.setAttribute('aria-live','polite');
        content.append(label,controls,status,node('p','A black landing loses the entire wager. Gold raises your total multiplier; multipliers do not stack. Cashing out during a spin queues payment if that spin wins. Closing this screen keeps the round running—return here to cash out.','coin-rules'));
    }});
    function update() {
        const now=performance.now(); game.update(now);
        if (!visible() || !ring) return;
        const spin=game.spin ?? game.lastSpin;
        const chance=spin?.probability ?? .85;
        ring.style.background=`conic-gradient(#efc650 0deg ${chance*360}deg, #050509 ${chance*360}deg 360deg)`;
        let angle=0;
        if(spin) {
            const progress=Math.max(0,Math.min(1,(now-spin.startedAt)/crashConfig.spinMs));
            angle=(1440+spin.landing*360)*(1-(1-progress)**3);
        }
        marker.style.transform=`rotate(${angle}deg)`;
        amount.textContent=`${game.multiplier.toLocaleString(undefined,{maximumFractionDigits:2})}×`;
        wager.disabled=game.active;
        risk.disabled=!!game.spin || (game.active && !game.next);
        risk.textContent=game.spin ? 'Spinning…' : game.active ? game.next ? `Risk for ${game.next.multiplier.toLocaleString()}×` : 'Maximum reached' : 'Bet & spin';
        cash.disabled=!game.active || game.queuedCashout;
        cash.textContent=game.queuedCashout ? 'Cash-out queued' : `Cash out${game.active ? ` · $${(game.wagerCents*game.multiplier/100).toFixed(2)}` : ''}`;
        if(game.result) {
            if(shownResult!==game.result){shownResult=game.result;readSince=null;}
            if(!document.hidden && readSince===null)readSince=now;
            status.textContent=game.result.won ? `Cashed out $${game.result.payout.toFixed(2)} at ${game.result.multiplier}×!` : `CRASH! Lost $${(game.wagerCents/100).toFixed(2)}.`;
        } else status.textContent=game.spin ? `Spinning for ${game.spin.multiplier}×${game.queuedCashout ? ' · Cash-out queued if gold wins' : ''}` : game.active ? 'Gold! Cash out or risk another spin.' : 'Land on gold to climb.';
    }
    window.addEventListener('keydown',event=>{
        if(event.code!=='KeyR'||event.repeat||event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.target?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(event.target?.tagName)||world.scene!=='casino'||document.body.classList.contains('game-paused'))return;
        if(visible()){event.preventDefault();gui.close();}
        else if(!gui.isOpen&&world.casinoInterior.canPlayTable(player,'crash')){event.preventDefault();gui.open('crash');update();}
    });
    document.addEventListener('visibilitychange',()=>{if(document.hidden)readSince=null;});
    return {update,get blocksGameOver(){return game.active || (visible() && !!game.result && (document.hidden||readSince===null||performance.now()-readSince<2000));}};
}
