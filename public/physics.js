/* DOCUMENTATION
    On every event, the GmaeManager will be passed as an argument unles specified otherwise

    constructor: A required field, declare it and leave empty if you dont need it. gets an object instead of GameManager for argument
    onTick: used in both client and server, used every 1/60 seconds. i dont recommend using Date.now() btw
    onHit: activated when the hitbox has been hit 
    onMove: activates when the client presses a key or moves the mouse. used for controls. Server-side only.

    DO NOT USE "id" AS A PROPERTY, it will be automatically created!
*/

class Player {
    constructor(data) {
        this.x = 0;
        this.y = 0;
		this.eyeAngle = 0;
		this.color = `rgb(${Math.round(Math.random() * 255)}, ${Math.round(Math.random() * 255)}, ${Math.round(Math.random() * 255)})`;
    }
    onMove(tool, data) {
        const keys = data.keys;
		const mouse = data.mouse;

		let speed = tool.global.playerSpeed;
		const dx = mouse.x - this.x;
		const dy = mouse.y - this.y;

		const angleRadians = Math.atan2(dy, dx);
		this.eyeAngle = angleRadians * (180 / Math.PI);

		if (keys.includes("w")) {
			this.y -= speed; // Move up
		}
		if (keys.includes("a")) {
			this.x -= speed; // Move left
		}
		if (keys.includes("s")) {
			this.y += speed; // Move down
		}
		if (keys.includes("d")) {
			this.x += speed; // Move right
		}

        return tool;
    }
}

class GameManager {
    constructor() {
        this.objects = { Player }

        this.objectList = [];
        for (let name in this.objects) this.objectList.push(name);

        this.global = {
            playerSpeed: 3
        }
        this.state = {};
    }
    create(name, id, data) {
        if (!this.objectList.includes(name)) throw `Invalid object name called ${name}`;
        if (!this.state[name]) this.state[name] = {};

        let temp = new this.objects[name](data)
        temp.id = id
        this.state[name][id] = temp
    }
    onMove(data) {
        let a = this;
        for (let name in this.state) {
            for (let id in this.state[name]) {
                a = this.state[name][id].onMove(a, data)
            }
        }
        return a;
    }
}

export default GameManager;