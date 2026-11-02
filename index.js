const config = require("./config");

const fs = require("fs-extra");
const ntpClient = require("ntp-client");
const moment = require("moment-timezone");
const EventEmitter = require("events");

const winston = require("winston");
require("winston-daily-rotate-file");

function formatTwoDigits(n) {
	return n < 10 ? "0" + n : n;
}

const file = new winston.transports.DailyRotateFile({
	filename      : "logs/%DATE%.log",
	datePattern   : "YYYY-MM-DD",
	zippedArchive : true,
	maxSize       : "20m",
	maxFiles      : "14d",
});

const logger = winston.createLogger({
	level  : "info",
	format : winston.format.printf(info => {
		const date = new Date();
		return `[${formatTwoDigits(date.getHours())}:${formatTwoDigits(date.getMinutes())}:${formatTwoDigits(date.getSeconds())}][${info.level.toUpperCase()}]: ${info.message}`;
	}),
	transports: [new winston.transports.Console(), file],
});

const global_data = {
	region       : JSON.parse(fs.readFileSync("./resource/region.json").toString()),
	station_info : {},
	events       : new EventEmitter(),
	rts          : {},

	data: {
		rts: {
			station : {},
			box     : {},
			int     : [],
			time    : 0,
		},
		eew       : [],
		intensity : [],
		lpgm      : [],
	},

	station_alert_list : [],
	last_data_time     : {},
	freeze_station     : {},
	freeze_list        : {},
	wave_list          : [],
	wave_alert_list    : [],
	eq_group           : [],
	eq_report_list     : [],

	time: {
		syncedTime : 0,
		lastSync   : 0,
	},

	broadcast  : null,
	loc_search : null,

	file        : {},
	file_status : {
		eq    : false,
		cache : false,
	},
};

try {
	global_data.freeze_list = JSON.parse(fs.readFileSync("./resource/freeze.json").toString());
} catch (err) {
	fs.writeFileSync("./resource/freeze.json", JSON.stringify([]));
}

readStationInfo();
setInterval(() => readStationInfo(), 60 * 1000 * 5);

async function readStationInfo() {
	const res = await fetchData("https://raw.githack.com/ExpTechTW/API/master/resource/station.json");
	if (res == null) return setTimeout(readStationInfo, 5000);
	try {
		global_data.station_info = await res.json();
	} catch (err) {
		logger.error("[readStationInfo] => " + err);
	}
}

class SyncedTime {
	constructor() {
		this.syncedTime = null;
		this.lastSync = null;
	}

	syncTime() {
		const t = Date.now();
		ntpClient.getNetworkTime("time.exptech.com.tw", 123, (err, date) => {
			if (err) {
				console.log(err);
				return;
			}

			const lag = Date.now() - t;
			if (lag < 500 || (!global_data.time.syncedTime && lag < 500)) {
				this.syncedTime = moment(date).tz("Asia/Taipei").valueOf();
				this.lastSync = Date.now();
				global_data.time.syncedTime = this.syncedTime;
				global_data.time.lastSync = this.lastSync;
			} else logger.error("[ntp] => time out " + lag);
		});
	}

	now() {
		if (!this.syncedTime || !this.lastSync) return Date.now();
		const offset = Date.now() - this.lastSync;
		return this.syncedTime + offset;
	}
}

const syncedTime = new SyncedTime();
syncedTime.syncTime();
setInterval(() => syncedTime.syncTime(), 60000);

require("./core/file")(global_data, logger);
require("./core/location")(global_data, logger);

if (config.mode == "ONLINE") {
	require("./core/data/realtime")(global_data, logger);
	require("./core/service/websocket")(global_data, logger);
	require("./core/wave")(global_data, logger);
} else {
	require("./core/data/replay")(global_data, logger);
	require("./core/record")(global_data, logger);
}

require("./core/service/lpgm")(global_data, logger);
require("./core/service/http")(global_data, logger);
require("./core/raw")(global_data, logger);
require("./core/trigger")(global_data, logger);
require("./core/eew")(global_data, logger);
require("./core/rts")(global_data, logger);

fs.ensureDirSync("./intensity");

async function fetchData(url, timeout = 1500) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);
	try {
		const response = await fetch(url, { signal: controller.signal });
		clearTimeout(timeoutId);
		return response;
	} catch (error) {
		if (error.name === "AbortError") void 0;
		// logger.error(`[fetchData] => time out | ${url}`);
		else logger.error(`[fetchData] => fetch error: ${error.message} | ${url}`);
		return null;
	}
}