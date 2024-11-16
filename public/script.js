//import * as p5 from 'https://unpkg.com/p5@1.4.0/lib/p5.min.js';
import { io } from "https://esm.sh/socket.io-client";
import GameManager from "./physics.js";

let game = new GameManager();
const socket = io();
let users = {};
let keys = new Set();

let wSize = 0;
let aniTime = 0;
let mousePosHash = 0; // basically mouseX+mouseY acting as hash

const sketch = (p) => {
	p.setup = () => {
		wSize = Math.min(p.windowWidth, p.windowHeight);
		p.createCanvas(wSize, wSize);
	};
	p.draw = () => {
		p.background(240);
		p.noStroke();

		p.fill(255, 0, 0);
		p.rect(p.width / 2 - 30, p.height / 2 - 50 + getFlagOffset(1), 12, 25);
		p.rect(p.width / 2 - 19, p.height / 2 - 50 + getFlagOffset(2), 12, 25);
		p.rect(p.width / 2 - 8, p.height / 2 - 50 + getFlagOffset(3), 12, 25);
		aniTime++;

		for (let playerName in game.state.Player) {
			const player = game.state["Player"][playerName];
			p.stroke(1);
			p.fill(player.color);
			p.square(player.x, player.y, 20);

			p.noStroke();
			p.fill(255);
			p.ellipse(player.x + 5, player.y + 5, 10, 10);
			p.ellipse(player.x + 15, player.y + 5, 10, 10);

			const pupils = getOffsetPoint(player.x, player.y, player.eyeAngle, 3);
			p.fill(0);
			p.ellipse(pupils.x + 5, pupils.y + 5, 5, 5);
			p.ellipse(pupils.x + 15, pupils.y + 5, 5, 5);
		}

		p.fill(0);
		p.rect(p.width / 2 - 35, p.height / 2 - 50, 5, 50);

		// input
		if (p.keyIsPressed || mousePosHash != p.mouseX + p.mouseY) {
			socket.emit("move", {
				keys: Array.from(keys),
				mouse: { x: p.mouseX, y: p.mouseY },
			});
		}
		mousePosHash = p.mouseX + p.mouseY;
	};
	p.keyPressed = () => {
		keys.add(p.key.toLowerCase());
	};

	p.keyReleased = () => {
		keys.delete(p.key.toLowerCase());
	};
};

new p5(sketch);

function getFlagOffset(id) {
	return Math.round(Math.sin(aniTime / 3 + id));
}

function getOffsetPoint(x_c, y_c, angle, distance) {
	// Convert angle to radians
	let angleRadians = angle * (Math.PI / 180);

	// Calculate new x, y based on angle and distance
	let x_offset = x_c + distance * Math.cos(angleRadians);
	let y_offset = y_c + distance * Math.sin(angleRadians);

	return { x: x_offset, y: y_offset };
}

socket.on("connect", () => {
	socket.emit("join");
	console.log("Connected!");
});

socket.on("loginAgain", () => {
	window.location.replace("/");
	window.location.reload();
	console.log("Attempting reload");
});

socket.on("fullSync", (data) => {
	console.log("Full synced");
	console.log(data.state.Player);
	users = data.userData;
	game.state = data.state;
});

socket.on("playerSync", (data) => {
	game.state = data.content;
});
