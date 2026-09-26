// Tracks active real time, including gaps between frames in a background tab.
export default class SimulationClock {
    constructor(now = performance.now()) {
        this.lastTime = now;
        this.paused = false;
    }
    tick(now) {
        const time = Math.max(this.lastTime, now);
        const elapsed = (time - this.lastTime) / 1000;
        this.lastTime = time;
        return this.paused ? 0 : elapsed;
    }
    pause(now) {
        const elapsed = this.tick(now);
        this.paused = true;
        return elapsed;
    }
    resume(now) {
        this.lastTime = Math.max(this.lastTime, now);
        this.paused = false;
    }
}
