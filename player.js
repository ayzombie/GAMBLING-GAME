export default class Player {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.speed = 6; //org: 6
        this.keys = {};


        window.addEventListener("keydown", (e) => {
            this.keys[e.code] = true;
        });

        window.addEventListener("keyup", (e) => {
            this.keys[e.code] = false;
        });
        window.addEventListener("blur", () => {
            this.keys = {};
        });
    }

    update(world) {
        let dx = Number(!!this.keys["KeyD"]) - Number(!!this.keys["KeyA"]);
        let dy = Number(!!this.keys["KeyS"]) - Number(!!this.keys["KeyW"]);
        const length = Math.hypot(dx, dy) || 1;
        world.movePlayer(this, dx / length * this.speed, dy / length * this.speed);
    }

    draw(ctx) {
        ctx.fillStyle = "rgba(25, 45, 35, 0.25)";
        ctx.beginPath();
        ctx.ellipse(this.x + 4, this.y + 14, 15.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
        ctx.fill();
        const shading = ctx.createRadialGradient(this.x - 5.5, this.y - 6.5, 1, this.x, this.y, 15.5);
        shading.addColorStop(0, "rgba(255, 255, 255, 0.55)");
        shading.addColorStop(0.5, "rgba(255, 255, 255, 0)");
        shading.addColorStop(1, "rgba(0, 0, 0, 0.3)");
        ctx.fillStyle = shading;
        ctx.fill();
    }

    move(direction) {
        switch (direction) {
            case "left":
                this.x -= this.speed;
                break;
            case "right":
                this.x += this.speed;
                break;
            case "up":
                this.y -= this.speed;
                break;
            case "down":
                this.y += this.speed;
                break;
        }
    }
}
