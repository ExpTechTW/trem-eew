const fs = require("fs-extra");

module.exports = (global_data, logger) => {
	fs.ensureDirSync("./data");

	try {
		global_data.file.eq = JSON.parse(fs.readFileSync("./data/eq.json").toString());
	} catch (err) {
		logger.error("(eq.json) error");
		fs.writeFileSync("./data/eq.json", JSON.stringify([]));
		global_data.file.eq = JSON.parse(fs.readFileSync("./data/eq.json").toString());
	}

	try {
		global_data.file.cache = JSON.parse(fs.readFileSync("./data/cache.json").toString());
	} catch (err) {
		logger.error("(cache.json) error");
		fs.writeFileSync("./data/cache.json", JSON.stringify({
			day   : new Date().getDate(),
			count : 1,
		}));
		global_data.file.cache = JSON.parse(fs.readFileSync("./data/cache.json").toString());
	}

	setInterval(() => {
		if (global_data.file_status.eq)
			fs.writeFile("./data/eq.json", JSON.stringify(global_data.file.eq), () => global_data.file_status.eq = false);
		if (global_data.file_status.cache)
			fs.writeFile("./data/cache.json", JSON.stringify(global_data.file.cache), () => global_data.file_status.cache = false);
	}, 5000);
};