import MiningHouse from './miningHouse.js';
import MarketPlace from './marketPlace.js';
import Apartment from './apartment.js';
import Casino from './casino.js';
import CasinoInterior from './casinoInterior.js';

export const MAP_LENGTH = 1800;
export const MAP_HEIGHT = 1800;
export const SPAWN = { x: MAP_LENGTH / 2, y: MAP_HEIGHT / 2 };

export default class World {
    constructor() {
        this.cameraX = 0;
        this.cameraY = 0;
        this.scale = 1;
        this.miningHouse = new MiningHouse(55, 55);
        this.market = new MarketPlace(MAP_LENGTH / 2 - 100, 55, 200);
        this.apartment = new Apartment(SPAWN.x - 120, SPAWN.y + (MAP_HEIGHT - SPAWN.y) / 2 - 79, 240);
        this.casino = new Casino(MAP_LENGTH - 340, MAP_HEIGHT / 2 - 255, 300);
        this.buildings = [this.miningHouse, this.market, this.apartment, this.casino];
        this.casinoInterior = new CasinoInterior(MAP_LENGTH, MAP_HEIGHT);
        this.scene = 'outside';
        this.returnPosition = null;
        this.nextSceneChange = 0;
    }

    useCasinoDoor(player, now = performance.now()) {
        if (now < this.nextSceneChange) return false;
        if (this.scene === 'outside') {
            if (!this.casino.canInteract(player)) return false;
            this.returnPosition = { x: player.x, y: player.y };
            this.scene = 'casino';
            Object.assign(player, this.casinoInterior.spawn);
        } else {
            if (!this.casinoInterior.canExit(player)) return false;
            this.scene = 'outside';
            Object.assign(player, this.returnPosition ?? SPAWN);
        }
        player.keys = {};
        this.nextSceneChange = now + 500;
        return true;
    }

    movePlayer(player, dx, dy) {
        if (this.scene === 'casino') return this.casinoInterior.movePlayer(player, dx, dy);
        const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 2));
        for (let i = 0; i < steps; i++) {
            const x = Math.max(15, Math.min(MAP_LENGTH - 20, player.x + dx / steps));
            if (!this.buildings.some(building => building.blocksPlayer(x, player.y))) player.x = x;
            const y = Math.max(15, Math.min(MAP_HEIGHT - 20, player.y + dy / steps));
            if (!this.buildings.some(building => building.blocksPlayer(player.x, y))) player.y = y;
        }
    }

    update(player, width, height) {
        this.scale = Math.max(1, height / MAP_HEIGHT, width / MAP_LENGTH);
        const visibleWidth = width / this.scale;
        const visibleHeight = height / this.scale;
        this.cameraX = Math.max(0, Math.min(MAP_LENGTH - visibleWidth, player.x - visibleWidth / 2));
        this.cameraY = Math.max(0, Math.min(MAP_HEIGHT - visibleHeight, player.y - visibleHeight / 2));
    }

    drawRoad(ctx) {
        const house = this.miningHouse;
        const doorX = house.x + house.size * 0.44;
        const doorY = house.y + house.size * 0.87;
        const apartment = this.apartment;
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'butt';
        const path = () => {
            ctx.beginPath();
            ctx.moveTo(SPAWN.x + 75, SPAWN.y);
            ctx.lineTo(doorX + 55, SPAWN.y);
            ctx.quadraticCurveTo(doorX, SPAWN.y, doorX, SPAWN.y - 55);
            ctx.lineTo(doorX, doorY);
            ctx.moveTo(SPAWN.x, SPAWN.y);
            ctx.lineTo(MAP_LENGTH / 2, this.market.y + this.market.size * 0.85);
            ctx.moveTo(SPAWN.x, SPAWN.y);
            ctx.lineTo(SPAWN.x, apartment.hitbox.y);
            ctx.moveTo(SPAWN.x, SPAWN.y);
            ctx.lineTo(this.casino.x + this.casino.size * .44, SPAWN.y);
        };
        ctx.strokeStyle = '#a8926f';
        ctx.lineWidth = 82;
        path();
        ctx.stroke();
        ctx.strokeStyle = '#ead7af';
        ctx.lineWidth = 76;
        path();
        ctx.stroke();
        ctx.strokeStyle = '#d6c29a';
        ctx.lineWidth = 68;
        path();
        ctx.stroke();
        ctx.fillStyle = '#af987644';
        for (let x = doorX + 60; x < SPAWN.x + 70; x += 31) {
            ctx.fillRect(x, SPAWN.y + Math.sin(x) * 23, 5, 2);
        }
        for (let y = doorY + 12; y < SPAWN.y - 55; y += 29) {
            ctx.fillRect(doorX + Math.sin(y) * 24, y, 4, 2);
        }
        ctx.restore();
    }

    draw(ctx, width, height, player) {
        if (this.scene === 'casino') return this.casinoInterior.draw(ctx, width, height, player, this);
        ctx.fillStyle = '#c4d5b6';
        ctx.fillRect(0, 0, width, height);
        ctx.save();
        ctx.scale(this.scale, this.scale);
        ctx.translate(-this.cameraX, -this.cameraY);
        // Seed each ground patch by its map position so it never flickers or slides.
        const right = Math.min(MAP_LENGTH, this.cameraX + width / this.scale);
        const bottom = Math.min(MAP_HEIGHT, this.cameraY + height / this.scale);
        for (let cellX = Math.max(0, Math.floor(this.cameraX / 100) - 1); cellX <= Math.ceil(right / 100); cellX++) {
            for (let cellY = Math.max(0, Math.floor(this.cameraY / 100) - 1); cellY <= Math.ceil(bottom / 100); cellY++) {
                let seed = (Math.imul(cellX + 1, 73856093) ^ Math.imul(cellY + 1, 19349663)) >>> 0;
                const random = () => {
                    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
                    return seed / 4294967296;
                };
                const x = cellX * 100 + 15 + random() * 70;
                const y = cellY * 100 + 15 + random() * 70;
                ctx.fillStyle = random() > 0.5 ? '#8da57512' : '#e8dfb519';
                ctx.beginPath();
                ctx.ellipse(x, y, 18 + random() * 22, 9 + random() * 12, random() * Math.PI, 0, Math.PI * 2);
                ctx.fill();
                for (let i = 0; i < 12; i++) {
                    ctx.fillStyle = i % 2 ? '#667c5821' : '#f2ebce38';
                    ctx.fillRect(cellX * 100 + random() * 100, cellY * 100 + random() * 100,
                        1 + random() * 2, 1 + random());
                }
                ctx.strokeStyle = '#6c895c38';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x - 3, y + 3);
                ctx.lineTo(x - 5, y - 2);
                ctx.moveTo(x, y + 3);
                ctx.lineTo(x + 1, y - 5);
                ctx.moveTo(x + 3, y + 3);
                ctx.lineTo(x + 6, y - 1);
                ctx.stroke();
            }
        }
        this.drawRoad(ctx);
        const actors = this.buildings.map(building => ({
            depth: building.y + building.size * 0.85, draw: () => building.draw(ctx),
        }));
        actors.push({ depth: player.y + 13, draw: () => player.draw(ctx) });
        actors.sort((a,b) => a.depth - b.depth);
        for (const actor of actors) actor.draw();
        for (const building of this.buildings) building.drawPrompt(ctx, player);
        ctx.restore();
    }
}
