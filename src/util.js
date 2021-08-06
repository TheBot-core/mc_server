const fs = require("fs");

class Util {

	constructor() {
		throw new Error(`The ${this.constructor.name} class may not be instantiated.`);
	}

	static readConfigSync(what) {
		return JSON.parse(fs.readFileSync("config.json"))[what];
	}

	static saveConfigSync(what, val) {
		let config = JSON.parse(fs.readFileSync("config.json"));
		config[what] = val;
		fs.writeFileSync("config.json", JSON.stringify(config, undefined, 4));
	}

}

module.exports = Util;