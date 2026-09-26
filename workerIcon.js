const SVG_NS = 'http://www.w3.org/2000/svg';

export function createWorkerIcon(tier, index) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('worker-icon');
    const group = document.createElementNS(SVG_NS, 'g');
    group.classList.add('worker-pickaxe');
    group.style.animationDelay = '0s';
    const shape = (points, color) => {
        const polygon = document.createElementNS(SVG_NS, 'polygon');
        polygon.setAttribute('points', points);
        polygon.setAttribute('fill', color);
        group.append(polygon);
    };
    // Chunky stepped silhouette, with a diagonal wooden handle.
    shape('25,77 31,83 68,44 61,38', '#54351f');
    shape('25,75 30,79 66,41 61,36', '#ab783f');
    shape('27,74 29,76 64,39 62,37', '#e1b471');
    shape('24,25 34,18 54,18 54,23 65,23 65,29 76,29 76,37 83,37 83,57 75,65 71,47 64,40 55,35 43,30 24,32', tier.shade);
    shape('22,22 33,15 53,15 53,20 64,20 64,26 75,26 75,34 82,34 82,53 75,61 69,43 62,36 53,31 42,26 22,29', tier.color);
    shape('22,22 33,15 53,15 53,19 34,19 25,25 22,29', tier.highlight);
    shape('55,22 64,22 64,26 73,28 69,31 61,27 55,26', tier.highlight);
    if (tier.band) {
        shape('46,23 51,20 60,29 56,34', tier.band);
        shape('65,34 70,31 77,41 73,45', tier.band);
    }
    if (index === 9) {
        shape('35,20 39,24 35,28 31,24', '#bcffff');
        shape('77,44 80,48 77,53 74,48', '#bcffff');
    }
    svg.append(group);
    return svg;
}
