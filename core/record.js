const { formatTime } = require("../utils/utils");

const fs = require("fs-extra");

let record_time = 0;

module.exports = (global_data, logger) => {
	fs.ensureDirSync("./records");
	fs.ensureDirSync("./csv");

	setInterval(() => {
		if (global_data.time_now == record_time) return;
		record_time = global_data.time_now;
		fs.outputFile(`./records/${global_data.time_now}.json`, JSON.stringify({
			rts       : global_data.data.rts,
			eew       : global_data.data.eew,
			intensity : global_data.data.intensity,
			eq        : global_data.eq_group,
		}), () => void 0);
	}, 0);
};