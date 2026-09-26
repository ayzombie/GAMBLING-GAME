export function priceChange(current, previous) {
    const difference = Math.round((current - previous) * 100) / 100;
    return { difference, percentage: previous > 0 ? difference / previous * 100 : 0 };
}

export function historyStats(history) {
    let high = -Infinity, low = Infinity;
    for (const point of history) { high = Math.max(high, point.price); low = Math.min(low, point.price); }
    return { high, low, ...priceChange(history.at(-1).price, history[0].price) };
}

export function changeText(change) {
    const sign = change.difference < 0 ? '−' : '+';
    return `${sign}$${Math.abs(change.difference).toFixed(2)} (${sign}${Math.abs(change.percentage).toFixed(2)}%)`;
}

// Match the chart's smooth Bezier line, then select its nearest stored endpoint.
export function pickChartSnapshot(points, mouse, radius = 10) {
    let best = radius * radius, selected = null;
    const check = (x, y, index) => {
        const distance = (x-mouse.x)**2 + (y-mouse.y)**2;
        if (distance <= best) { best = distance; selected = index; }
    };
    points.forEach(point => check(point.x,point.y,point.index));
    for (let i=1;i<points.length;i++) {
        const a=points[i-1], b=points[i], mid=(a.x+b.x)/2;
        const steps=Math.max(12,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4));
        for(let step=0;step<=steps;step++) {
            const t=step/steps,u=1-t;
            check(u**3*a.x+3*u*u*t*mid+3*u*t*t*mid+t**3*b.x,
                (u**3+3*u*u*t)*a.y+(3*u*t*t+t**3)*b.y,
                t<0.5?a.index:b.index);
        }
    }
    return selected;
}
