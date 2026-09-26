export default class NewsSimulation {
    constructor(market, events, config, startMinute, seed) {
        if (!Number.isFinite(config.minIntervalMinutes) || config.minIntervalMinutes <= 0 ||
            !Number.isFinite(config.maxIntervalMinutes) || config.maxIntervalMinutes < config.minIntervalMinutes ||
            !Number.isSafeInteger(config.maxReports) || config.maxReports < 1) throw new Error('Invalid newsConfig.');
        this.market = market;
        this.config = config;
        this.noNewsChance = config.noNewsChance ?? 0.30;
        if (!Number.isFinite(this.noNewsChance) || this.noNewsChance < 0 || this.noNewsChance > 1) {
            throw new Error('News noNewsChance must be between 0 and 1.');
        }
        this.activeStories = new Set();
        this.usedStories = new Set();
        this.disabledStories = new Set();
        this.events = events.filter(event => event.enabled);
        for (const event of this.events) {
            if (!Number.isFinite(event.weight) || event.weight <= 0 ||
                (event.create !== undefined && typeof event.create !== 'function')) {
                throw new Error(`Invalid news entry: ${event.id}. Check weight and create function.`);
            }
            if (!event.create) this.validateReport(event, event.id);
        }
        this.state = 2166136261;
        for (const char of `${seed}:news`) this.state = Math.imul(this.state ^ char.charCodeAt(0), 16777619) >>> 0;
        this.reports = [];
        this.version = 0;
        this.nextReport = this.events.length ? startMinute + this.interval() : Infinity;
    }
    isEligible(event) {
        return !this.disabledStories.has(event.id) && !this.activeStories.has(event.id) &&
            !(event.once && this.usedStories.has(event.id)) &&
            (!event.requiresActive || this.activeStories.has(event.requiresActive));
    }
    broadcast(event) {
        if (!this.isEligible(event)) return null;
        const report = event.create ? event.create(() => this.random()) : event;
        this.validateReport(report, event.id);
        const baselines = event.resolves ? this.market.releaseNewsHold(event.resolves) : {};
        if (event.resolves) this.activeStories.delete(event.resolves);
        for (const id of event.disables ?? []) this.disabledStories.add(id);
        for (const [type, percent] of Object.entries(report.impacts)) {
            this.market.applyNewsImpact(type, percent, {
                holdId: event.persistent ? event.id : null,
                basePrice: baselines[type] ?? this.market.prices[type],
            });
        }
        if (event.persistent) this.activeStories.add(event.id);
        this.usedStories.add(event.id);
        return report;
    }
    validateReport(report, id) {
        if (typeof report?.message !== 'string' || !report.message.trim() ||
            !report.impacts || typeof report.impacts !== 'object' || Array.isArray(report.impacts) ||
            Object.entries(report.impacts).some(([type, change]) =>
                !Object.hasOwn(this.market.prices, type) || !Number.isFinite(change) || change < -1)) {
            throw new Error(`Invalid news entry: ${id}. Check message and resource impacts.`);
        }
    }
    random() {
        this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
        return this.state / 4294967296;
    }
    interval() {
        return this.config.minIntervalMinutes + this.random() * (this.config.maxIntervalMinutes - this.config.minIntervalMinutes);
    }
    update(minute) {
        // Process broadcasts and market ticks in chronological order, including background catch-up.
        while (minute >= this.nextReport) {
            this.market.update(this.nextReport);
            let report = null;
            const eligible = this.events.filter(event => this.isEligible(event));
            if (this.random() >= this.noNewsChance && eligible.length) {
                let roll = this.random() * eligible.reduce((sum, event) => sum + event.weight, 0);
                const event = eligible.find(event => (roll -= event.weight) < 0) ?? eligible.at(-1);
                report = this.broadcast(event);
            }
            // Quiet intervals produce no report, so the radio never opens for them.
            if (report) {
                this.reports.unshift({ message: report.message, impacts: { ...report.impacts }, minute: this.nextReport });
                this.reports.length = Math.min(this.reports.length, this.config.maxReports);
                this.version++;
            }
            this.nextReport += this.interval();
        }
        this.market.update(minute);
    }
}
