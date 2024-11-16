import { join } from "path";
import express from "express";
// import os from "os";
import { createServer } from "http";
import { Server } from "socket.io";
import passport from "passport";
import { Strategy } from "passport-discord";
import session from "express-session";
import sqlite from "connect-sqlite3";
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import GameManager from "./public/physics.js";
import env from "dotenv"
env.config();

const app = express();
const server = createServer(app);
const io = new Server(server);
const sql = sqlite(session);

let cfg = {};
const cfgPath = path.resolve('config.json');

fs.readFile(cfgPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the config file:', err);
    return;
  }
  
  cfg = JSON.parse(data);
  console.log(cfg);
});

passport.use(
	new Strategy(
		{
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL: process.env.REDIRECT_URI, // for easy setup purposes we put this in env
			scope: ["identify"],
		},
		function (accessToken, refreshToken, profile, done) {
			return done(null, profile);
		},
	),
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

const sessionMiddleware = session({
	secret: process.env.SECRET,
	resave: false,
	saveUninitialized: false,
	store: new sql(),
});
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use("/static", express.static(__dirname + "/public"));

app.get("/", (req, res) => {
	// We don't want the bots or embed scrape discord's meta information instead of ours
	const isBot = req.headers["user-agent"].includes("bot");
	const isSharedLink = req.query.shared === "true";

	if (isBot || isSharedLink) {
		res.send(`
            <html>
                <head>
                    <title>${cfg.meta.title}</title>
                    <meta name="title" content="${cfg.meta.title}">
                    <meta name="description" content="${cfg.meta.description}">
                    <meta name="keywords" content="${cfg.meta.tags}">
                    <meta name="robots" content="index, follow">
                    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
                    <meta name="language" content="English">
                </head>
                <body>
                    <h1>${cfg.meta.description}</h1>
                </body>
            </html>
        `);
	} else {
		res.redirect("/login");
	}
});

app.get("/login", passport.authenticate("discord"));

app.get(
	"/callback",
	passport.authenticate("discord", { failureRedirect: "/" }),
	(req, res) => {
		console.log("[AUTH] Finished authentication");
		res.redirect("/game");
	},
);

app.get("/game", (req, res) => {
	if (!req.isAuthenticated() || !req.user) res.redirect("/");
	let user = req.user;

	game.create("Player", user.id, { id: user.id });

	if (userData[req.user.id]) {
		// every time they refresh
		// user.list[req.user.id] already exists so we modify it (trust this comment aint useless)
		userData[req.user.id].level = user.level;
		userData[req.user.id].username = user.username;
		userData[req.user.id].avatarUrl = user.avatarUrl;
		user = userData[req.user.id];
	} else {
		// first time login
	}
	userData[req.user.id] = user;

	console.log("[AUTH] User profile initialised");
	res.sendFile(join(__dirname, "public", "index.html"));
});

const userData = {}; // very temporary solution
let game = new GameManager();

// i have NO idea what this chunk does but its essential
const wrap = (middleware) => (socket, next) =>
	middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));
io.use((socket, next) => {
	if (socket.request.user || !userData[socket.request.user?.id]) {
		next();
	} else {
		next(new Error("Unauthorized"));
	}
});

// Error-handling middleware
app.use((err, req, res, next) => {
	console.log("[ERROR] Error caught:", err);
	if (err.message === "Unauthorized") {
		return res.redirect("/login");
	}

	res.status(500).json({
		message: err.message || "Internal Server Error",
	});
});

io.on("connection", (socket) => {
	const user = userData[socket.request.user.id];
	socket.on("join", () => {
		if (!user) {
			console.log(
				"[AUTH] a user was not authenticated properly, " +
					socket.request.user.id,
			);
			socket.emit("loginAgain");
			return;
		}
		console.log(`[AUTH] ${user.username} joined the party!`);
		io.emit("fullSync", { userData, state: game.state });
	});

	socket.on("move", (data) => {
		game = game.onMove(data)
		io.emit("playerSync", { content: game.state });
	});

	socket.on("disconnect", () => {
		console.log(`[AUTH] soemone left :(`);
	});
});

// For non-technical or non-javascript visitors who don't understand what this is:
// No, this is not an IP logger. I'm trying to know where MY OWN server is hosted in.
/*function serverIP() {
    const interfaces = os.networkInterfaces(); // this only gets the list of IPs from my own OS
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
};*/

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
	console.log(`Server is running on localhost:${PORT}`);
});
