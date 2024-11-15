const socket = io();
let users = {};
let gameState = {};
let keys = new Set();

let wSize = 0;
let aniTime = 0;
let mousePosHash = 0; // basically mouseX+mouseY acting as hash

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
        stroke(1)
        fill(p.color)
        square(p.x, p.y, 20)

        noStroke();
        fill(255)
        ellipse(p.x+5, p.y+5, 10, 10);
        ellipse(p.x+15, p.y+5, 10, 10);
        const pupils = getOffsetPoint(p.x, p.y, p.eyeAngle, 3);
        fill (0)
        ellipse(pupils.x+5, pupils.y+5, 5, 5);
        ellipse(pupils.x+15, pupils.y+5, 5, 5);
    }

    fill(0); 
    rect(width / 2 - 35, height / 2 - 50, 5, 50);

    // inputs
    if (mousePosHash != mouseX+mouseY) {
        socket.emit("mouse", { x:mouseX, y:mouseY })
    }
    mousePosHash = mouseX+mouseY
    if (keyIsPressed) {
        socket.emit("move", { keys: Array.from(keys), mouse: { x:mouseX, y:mouseY } });
    }
}

function getFlagOffset(id) {
    return Math.round(Math.sin(aniTime/3+id))
}

function getOffsetPoint(x_c, y_c, angle, distance) {
    // Convert angle to radians
    let angleRadians = radians(angle);
  
    // Calculate new x, y based on angle and distance
    let x_offset = x_c + distance * cos(angleRadians);
    let y_offset = y_c + distance * sin(angleRadians);
  
    return { x: x_offset, y: y_offset };
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