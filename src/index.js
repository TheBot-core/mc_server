const { createBot } = require("mineflayer");
const express = require("express");
const Util = require("./util");
const { pathfinder, Movements, goals: { GoalNear } } = require('mineflayer-pathfinder');
const autoeat = require('mineflayer-auto-eat');
const { mineflayer: mineflayerViewer } = require('prismarine-viewer');

const vec3 = require("vec3");

var chat_queue = [];

const bot = createBot({
	username: Util.readConfigSync("username"),
	host: Util.readConfigSync("server").host,
	port: Util.readConfigSync("server").port,
	password: Util.readConfigSync("password"),
});

bot.loadPlugin(pathfinder);
bot.loadPlugin(autoeat);


bot.on("health", () => {
	if (bot.food === 20) {
		bot.autoEat.disable();
	} else {
		bot.autoEat.enable();
	}
});

bot.on("chat", (username, message) => {
	if (username === bot.username) {
		return;
	}

	console.log(`${username}: ${message}`);
	chat_queue.push({ username, message });
});

bot.once("spawn", () => {
	console.log("Spawned!");
	bot.chat("Hello, I'm a bot!");

	init_express(Util.readConfigSync("express_port"));

	if (Util.readConfigSync("webview_port")) {
		var webview_port = Util.readConfigSync("webview_port");
		mineflayerViewer(bot, {
			viewDistance: 4,
			port: webview_port,
			firstPerson: true
		});
	}
	
});

bot.on("error", (err) => {
	console.error(err);
	process.exit(1);
});

bot.on("kicked", (reason) => {
	console.log(`Kicked: ${reason}`);
	process.exit(1);
});

function init_express(port) {
	var app = express();
	
	app.use((req, res, next) => {
		console.log(`${req.method} ${req.url}`);
		next();
	});

	app.get("/", (req, res) => {
		res.send("<h1>Hello world!</h1>");
	});

	app.get("/user/chat/get", (req, res) => {
		var chat_msg = chat_queue.shift();
		res.send(JSON.stringify(chat_msg) ? JSON.stringify(chat_msg) : "null");
	});

	app.get("/user/chat/send", (req, res) => {
		bot.chat(req.query.message);
		res.send("OK");
	});

	app.get("/user/path/status", (req, res) => {
		res.send(JSON.stringify(bot.pathfinder.goal));
	});

	app.get("/user/path/start", (req, res) => {
		if (bot.pathfinder.goal) {
			res.send(500, "NO");
		} else {
			const mc_data = require("minecraft-data")(bot.version);
			const default_move = new Movements(bot, mc_data);

			bot.pathfinder.setGoal(new GoalNear(req.query.x, req.query.y, req.query.z, 1, default_move));
			res.send("OK");
		}
	});

	app.get("/bot/inventory", (req, res) => {
		res.send(JSON.stringify(bot.inventory));
	});

	app.get("/bot/entities", (req, res) => {
		res.send(JSON.stringify(bot.entities));
	});

	app.get("/bot/players", (req, res) => {
		res.send(JSON.stringify(bot.players));
	});

	app.get("/bot/entity", (req, res) => {
		res.send(JSON.stringify(bot.entity));
	});

	app.get("/bot/health", (req, res) => {
		res.send(JSON.stringify({
			health: bot.health,
			food: bot.food,
			saturation: bot.foodSaturation
		}));
	});

	app.get("/function/blockat", (req, res) => {
		var block = bot.blockAt(new vec3.Vec3(req.query.x, req.query.y, req.query.z));
		res.send(JSON.stringify(block));
	});

	app.get("/function/fish", (req, res) => {
		bot.fish();
		res.send("OK");
	});

	app.get("/function/equip", (req, res) => {
		const mc_data = require("minecraft-data")(bot.version);
		if (mc_data.itemsByName[req.query.item] == undefined) {
			res.send(500, "NO");
		} else {
			const item_id = mc_data.itemsByName[req.query.item].id;
			const inventory_slot = bot.inventory.findInventoryItem(item_id, null);

			if (inventory_slot == null) {
				res.send(500, "NO");
			} else {
				bot.equip(inventory_slot, req.query.hand).then(() => {
					res.send("OK")
				});
			}
		}
	});

	app.get("/function/equipped", (req, res) => {
		res.send(JSON.stringify(bot.heldItem));
	});

	app.get("/function/lookat", (req, res) => {
		bot.lookAt(new vec3.Vec3(req.query.x, req.query.y, req.query.z));
		res.send("OK");
	});

	app.get("/function/find_block", (req, res) => {
		const mc_data = require("minecraft-data")(bot.version);
		if (mc_data.blocksByName[req.query.matching] == undefined) {
			res.send(500, "NO");
		} else {
			const block_id = mc_data.blocksByName[req.query.matching].id;

			var block = bot.findBlock({
				matching: block_id,
				distance: 64
			});
			res.send(JSON.stringify(block));	
		}
	});

	app.get("/function/nearest_entity", (req, res) => {
		var entity = bot.nearestEntity();
		res.send(JSON.stringify(entity));
	});

	app.listen(port, () => {
		console.log(`Listening on port ${port}`);
	});
}