import { resourceList } from "./gameData.js";
// Edit these entries, then set enabled: true. Resource names match gameData.js.
// impacts are signed percentages: { Gold: 0.20, Iron: -0.10 } = +20% Gold, -10% Iron.
// These are target changes from the price at broadcast, reached through normal market updates.
// News overrides regular changes until its target is reached; newer news can replace it.
// Regular changes then resume. Other resources continue normally.
// persistent: true holds affected prices at their target until a resolving story runs.
// requiresActive: 'id' requires that persistent story; resolves: 'id' releases its hold.
// Resolution impacts use pre-crash prices. once: true prevents repeats this session.
// disables: ['id'] permanently excludes those stories this session, even after report cleanup.
// weight controls relative likelihood; weights do NOT need to total 100.
export const newsConfig = {
    noNewsChance: 0.30, // Chance each scheduled broadcast has no new news.
    minIntervalMinutes: 150,
    maxIntervalMinutes: 300,
    maxReports: 50,
};

export function getRandomResource(random = Math.random) {
    return resourceList[Math.floor(random() * resourceList.length)];
}

// Roll between min and max, then add a random offset between -vary and +vary.
export function getImpact(min, max, vary = 0, random = Math.random) {
    const base = min + random() * (max - min);
    const variation = (random() * 2 - 1) * vary;
    return base + variation;
}

export const newsEvents = [
    { id: "news-01", enabled: true, weight: 1, message: "Ducks have been reported drinking oil and turning into oil monsters. Everyone is now scared of oil.", impacts: { Oil: getImpact(-0.55, -0.3, 0.05) } },
    {
        id: "news-02", enabled: true, weight: 1,
        // Called once per broadcast; share this pick between message and impacts.
        create(random = Math.random) {
            const resource = getRandomResource(random);
            return { message: `Breaking News! Massive ${resource} shortage!`, impacts: { [resource]: getImpact(0.5, 0.75, 0.1) } };
        },
    },
    {
        id: "news-03", enabled: true, weight: 1,
        // Called once per broadcast; share this pick between message and impacts.
        create(random = Math.random) {
            const resource = getRandomResource(random);
            return { message: `There has been a ${resource} shortage.`, impacts: { [resource]: getImpact(0.2, 0.35, 0.07) } };
        },
    },
    {
        id: "news-04", enabled: true, weight: 1, persistent: true, once: true,
        create(random = Math.random) {
            return {
                message: "A new element named Aluminum has been discovered! Products that previously used iron have switched to this new material.",
                impacts: { Iron: Math.max(-1, getImpact(-1.9, -1.6, 0.2, random)) },
            };
        },
    },
    {
        id: "news-05", enabled: true, weight: 1, once: true,
        requiresActive: "news-04", resolves: "news-04", disables: ["news-04"],
        create(random = Math.random) {
            return {
                message: "Turns out, Aluminum, a newly discovered material, has been found to contain toxic chemicals unsuitable for consuming.",
                impacts: {
                    Iron: getImpact(0.3, 0.3, 0.07, random),
                    Titanium: getImpact(-0.15, 0.25, 0.05, random),
                    Gold: getImpact(0.1, 0.1, 0.03, random),
                },
            };
        },
    },
    { id: "news-06", enabled: true, weight: 1, message: "New technology using gold plating has been discovered! Computers can now no longer rust.", impacts: { Gold: getImpact(0.35, 0.45, 0.1) } },
    { id: "news-07", enabled: true, weight: 1, message: "A new building style using wood and stone has taken the world by storm!", impacts: { Wood: getImpact(0.2, 0.3, 0.7), Stone: getImpact(0.22, 0.28, 0.05) } },
    { id: "news-08", enabled: true, weight: 1, message: "Scientists have found new uses for neodymium! Colored glass, high tech lasers and magnets -- who knows what else...", impacts: { Neodymium: getImpact(0.4, 0.7, 0.15), Iron: getImpact(-0.15, -0.15, 0.05), Copper: getImpact(-0.25, -0.25, 0.05) } },
    { id: "news-09", enabled: true, weight: 1, message: "The agriculture side has had a breakthrough! A new material used for farmland named Mulch has been discovered. The recipe uses dirt, many farmers are now switching to this new material.", impacts: { Dirt: getImpact(0.2, 0.3, 0.06) } },
    { id: "news-10", enabled: true, weight: 1, message: "An average of 15,000 people die from electrical shocks annually. Electricians are now using rubber to wrap wires for insulation.", impacts: { Rubber: getImpact(0.6, 0.75, 0.25), Copper: getImpact(-0.35, -0.2, 0.05) } },
    { id: "news-11", enabled: true, weight: 0.9, message: "There has been reports of multiple robberies of precious jewels being stolen from banks. No jewels were recovered.", impacts: { Ruby: getImpact(0.2, 0.3, 0.02), Diamond: getImpact(-0.2, 0., 0.1) } },
    { id: "news-12", enabled: true, weight: 0.6, message: "The 2nd Industrial Evolution is here!", impacts: { Iron: getImpact(0.4, 0.4, 0.25), Copper: getImpact(0.35, 0.35, 0.2), Oil: getImpact(0.3, 0.3, 0.08), Rubber: getImpact(0.25, 0.25, 0.1), Titanium: getImpact(0.35, 0.35, 0.15), Neodymium: getImpact(0.56, 0.56, 0.3) } },
    { id: "news-13", enabled: true, weight: 0.3, message: "A recent political war has just happened.", impacts: { Gold: getImpact(-0.3, -0.3, 0.1), Copper: getImpact(-0.25, -0.2, 0.08), Oil: getImpact(-0.35, -0.35, 0.1), Iron: getImpact(-0.3, -0.2, 0.1), Titanium: getImpact(-0.35, -0.35, 0.15), Ruby: getImpact(-0.2, -0.2, 0.1), Diamond: getImpact(-0.4, -0.35, 0.15) } },
];