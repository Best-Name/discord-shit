const socket = io();
let users = {};
let gameState = {};
let keys = new Set();

let wSize = 0;
let aniTime = 0;

function setup() {
    wSize = Math.min(windowWidth, windowHeight);
    createCanvas(wSize, wSize)
}

function draw() {  
    background(240);
    noStroke();

    fill(255,0,0)
    rect(width / 2 - 30, height/2-50+getFlagOffset(1), 12, 25);
    rect(width / 2 - 19, height/2-50+getFlagOffset(2), 12, 25);
    rect(width / 2 - 8, height/2-50+getFlagOffset(3), 12, 25);
    aniTime++;

    stroke(1);
    for (let playerName in gameState) {
        const p = gameState[playerName];
        fill(p.color)
        square(p.x, p.y, wSize/50)
    }

    fill(0); 
    rect(width / 2 - 35, height / 2 - 50, 5, 50);

    if (keyIsPressed) {
        socket.emit("move", Array.from(keys));
    }
}

function getFlagOffset(id) {
    return Math.round(Math.sin(aniTime/3+id))
}


function keyPressed() {
    keys.add(key.toLowerCase());
}
  
function keyReleased() {
    keys.delete(key.toLowerCase());
}

socket.on('connect', () => {
    socket.emit('join');
    console.log("Connected!")
});

socket.on("loginAgain", () => {
    window.location.replace("/");
    window.location.reload();
})

socket.on("fullSync", (data) => {
    users = data.userData;
    gameState = data.gameState;
})

socket.on("playerSync", (data) => {
    gameState[data.id] = data.content;
})