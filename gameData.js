import { seed } from './gameSeed.js';
import { createMarketPrices } from './marketPrices.js';

// Retained values and configuration; spawning and selling are not active.
export const resourceList = [
    "Dirt",
    "Wood",
    "Stone",
    "Copper",
    "Iron",
    "Rubber",
    "Oil",
    "Gold",
    "Ruby",
    "Diamond",
    "Titanium",
    "Neodymium"
];

export const baseResourcePrices = {
    "Dirt": 3,
    "Wood": 25,
    "Stone": 40,
    "Copper": 180,
    "Iron": 260,
    "Rubber": 175,
    "Oil" : 500,
    "Gold": 1300,
    "Ruby": 1800,
    "Diamond": 3500,
    "Titanium": 4600,
    "Neodymium": 7250,
};

// Current market prices, initialized once per session within ±5% of the base values.
export const resourcePrices = createMarketPrices(baseResourcePrices, seed);
export const gameState = { balance: 1000, gameMinutes: 8 * 60 };
export const marketHistory = {};
export const marketConfig = {
    minIntervalMinutes: 50,
    maxIntervalMinutes: 70,
    minMoveUpdates: 1,
    maxMoveUpdates: 5,
    singleStepScale: 0.25, // A 25% change has a 50% chance of taking just one update.
    movementNoise: 1.5, // Interim detours relative to the total change; may overshoot the target.
    smallChance: 0.81,
    mediumChance: 0.17,
    extremeChance: 0.02,
    smallMaxDollars: 51,
    mediumMaxDollars: 550,
    extremeMaxDollars: 4000,
    smallMaxPercent: 0.05,
    mediumMinPercent: 0.1,
    mediumMaxPercent: 0.25,
    extremeMinPercent: 0.45,
    extremeMaxPercent: 1.2,
    minimumPrice: 0.03,
    gameMinutesPerSecond: 2, // 20 game minutes per real second.
};

// Both upgrade tracks start at level 1 and stop at level 100.
export const minerUpgrades = {
    cycleBaseCost: 10,
    resourceBaseCost: 10,
    costMultiplierPerLevel: 1.73, //use this until lvl 20
    costMultiplierPerLevel2: 1.26,
    maxLevel: 100,
    cycleMultiplierPerLevel: 0.95, // 1% less time per level, compounded.
    extraResourcesPerLevel: 1, // Adds to the maximum possible yield.
};

// Editable starter balance. Weights are relative; they do not need to total 100.
// Each produced resource rolls independently against its tier's drops.
export const workerTiers = [
    {
        id: 'wooden',
        name: 'Wooden', color: '#aa753e', highlight: '#e4bc79', shade: '#624027',
        resourcesPerCycle: 1,
        cycleSeconds: 3,
        drops: [
            { type: 'Dirt', weight: 20 },
            { type: 'Wood', weight: 70 },
            { type: 'Stone', weight: 7 },
            { type: 'Copper', weight: 3 },
        ],
        cost: 100,
    },
    {
        id: 'stone',
        name: 'Stone', color: '#92948d', highlight: '#d4d5c9', shade: '#535951',
        resourcesPerCycle: 1,
        cycleSeconds: 3,
        drops: [
            { type: 'Dirt', weight: 15 },
            { type: 'Stone', weight: 70 },
            { type: 'Copper', weight: 10 },
            { type: 'Iron', weight: 5 },
        ],
        cost: 800,
    },
    {
        id: 'copper',
        name: 'Copper', color: '#c77643', highlight: '#ffc18b', shade: '#79432c',
        resourcesPerCycle: 2,
        cycleSeconds: 4,
        drops: [
            { type: 'Dirt', weight: 20 },
            { type: 'Stone', weight: 25 },
            { type: 'Copper', weight: 35 },
            { type: 'Iron', weight: 20 },
        ],
        cost: 2500,
    },
    {
        id: 'reinforced-iron',
        name: 'Reinforced Iron', color: '#b0bac5', highlight: '#f1f6ff', shade: '#596679', band: '#505b6c',
        resourcesPerCycle: 2,
        cycleSeconds: 4,
        drops: [
            { type: 'Stone', weight: 25 },
            { type: 'Copper', weight: 30 },
            { type: 'Iron', weight: 35 },
            { type: 'Gold', weight: 10 },
        ],
        cost: 6000,
    },
    {
        id: 'reinforced-diamond',
        name: 'Reinforced Diamond', color: '#49c9d6', highlight: '#c9ffff', shade: '#237c9b', band: '#e3f5ff',
        resourcesPerCycle: 2,
        cycleSeconds: 5,
        drops: [
            { type: 'Stone', weight: 10 },
            { type: 'Copper', weight: 22 },
            { type: 'Iron', weight: 30 },
            { type: 'Gold', weight: 35 },
            { type: 'Diamond', weight: 3 },
        ],
        cost: 18000,
    },
    {
        id: 'titanium',
        name: 'Titanium', color: '#939ace', highlight: '#e1e3ff', shade: '#525b88',
        resourcesPerCycle: 3,
        cycleSeconds: 5,
        drops: [
            { type: 'Copper', weight: 15 },
            { type: 'Iron', weight: 33 },
            { type: 'Gold', weight: 35 },
            { type: 'Diamond', weight: 12 },
            { type: 'Titanium', weight: 5 },
        ],
        cost: 35000,
    },
    {
        id: 'graphene',
        name: 'Graphene', color: '#3d555b', highlight: '#88b7ae', shade: '#1b2c32', band: '#65a296',
        resourcesPerCycle: 3,
        cycleSeconds: 7,
        cost: 65000,
        drops: [
            { type: 'Copper', weight: 5 },
            { type: 'Iron', weight: 30 },
            { type: 'Gold', weight: 27 },
            { type: 'Diamond', weight: 20 },
            { type: 'Ruby', weight: 15 },
            { type: 'Titanium', weight: 3 },
        ],
    },
    {
        id: 'tungsten',
        name: 'Tungsten', color: '#77788a', highlight: '#c9bdab', shade: '#3d3d4f', band: '#aba084',
        resourcesPerCycle: 3,
        cycleSeconds: 10,
        cost: 100000,
        drops: [
            { type: 'Copper', weight: 4 },
            { type: 'Iron', weight: 10 },
            { type: 'Gold', weight: 25 },
            { type: 'Diamond', weight: 24 },
            { type: 'Ruby', weight: 31 },
            { type: 'Titanium', weight: 6 },
        ],
    },
    {
        id: 'chromium',
        name: 'Chromium', color: '#c5d8e6', highlight: '#ffffff', shade: '#668caa', band: '#effaff',
        resourcesPerCycle: 4,
        cycleSeconds: 12,
        cost: 200000,
        drops: [
            { type: 'Copper', weight: 2 },
            { type: 'Iron', weight: 15 },
            { type: 'Gold', weight: 25 },
            { type: 'Diamond', weight: 20 },
            { type: 'Ruby', weight: 30 },
            { type: 'Titanium', weight: 7 },
            { type: 'Neodymium', weight: 1 },
        ],
    },
    {
        id: 'diamond-infused-carbon',
        name: 'Diamond-infused Carbon', color: '#333949', highlight: '#8ef7ff', shade: '#141c2a', band: '#47dcea',
        resourcesPerCycle: 5,
        cycleSeconds: 15,
        cost: 600000,
        drops: [
            { type: 'Ruby', weight: 30 },
            { type: 'Diamond', weight: 40 },
            { type: 'Titanium', weight: 25 },
            { type: 'Neodymium', weight: 5 },
        ],
    },
];

export const startingMiners = [];