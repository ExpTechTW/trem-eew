const LOCAL = "LOCAL";
const SERVER = "SERVER";
const side = SERVER;

const REPLAY = "REPLAY";
const ONLINE = "ONLINE";
const mode = ONLINE;

const LOCATION = "臺南";

const TREM_REPORT_WEBHOOK = process.env.TREM_REPORT_WEBHOOK;

const TREM_EEW_WEBHOOK = process.env.TREM_EEW_WEBHOOK;
const TREM_INTENSITY_WEBHOOK = process.env.TREM_INTENSITY_WEBHOOK;

module.exports = {
	side,
	mode,
	LOCATION,
	TREM_REPORT_WEBHOOK,
	TREM_EEW_WEBHOOK,
	TREM_INTENSITY_WEBHOOK,
};