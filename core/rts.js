const config = require("../config");
const { intensity_float_to_int, formatTime, formatTimestamp } = require("../utils/utils");

const turf = require("@turf/turf");
const fs = require("fs-extra");
const mariadb = require("mariadb");

const box_info = JSON.parse(fs.readFileSync("./resource/box.json").toString());

const pool = mariadb.createPool({
	host            : "mariadb",
	user            : "root",
	password        : process.env.DB_PASSWORD,
	database        : "exptech",
	connectionLimit : 5,
});
let rts_timestamp = 0;

module.exports = (global_data, logger) => {
	setInterval(() => {
		for (const id of Object.keys(global_data.rts)) {
			if (global_data.time_now - global_data.last_data_time[id] > 3000 || global_data.freeze_station[id]) {
				delete global_data.data.rts.station[id];
				continue;
			}

			if (!global_data.data.rts.station[id]) global_data.data.rts.station[id] = {};
			global_data.data.rts.station[id].pga = global_data.rts[id].pga;
			global_data.data.rts.station[id].pgv = global_data.rts[id].pgv;
			global_data.data.rts.station[id].i = global_data.rts[id].i;
			global_data.data.rts.station[id].I = Number(global_data.rts[id].I.toFixed(1));

			if (global_data.data.rts.station[id].alert && global_data.data.rts.station[id].I < 0)
				delete global_data.data.rts.station[id].alert;
		}

		const box_area = {};
		const int = [];
		for (const eq of global_data.eq_group) {
			if (!eq.alert) continue;

			let level_2_count = 0;
			for (let i = eq.group.length - 1; i >= 0; i--) {
				const station = eq.group[i];
				if (station.i >= 2) level_2_count++;
			}

			if (!eq.rts_alert) {
				const idNameMap = eq.group.reduce((accumulator, item) => {
					accumulator[item.id] = item.i;
					return accumulator;
				}, {});

				if (idNameMap[eq.trigger_view[0].id] > 3) {
					if (idNameMap[eq.trigger_view[1].id] > 1.5) eq.rts_alert = true;
					else if (idNameMap[eq.trigger_view[1].id] && idNameMap[eq.trigger_view[2].id]) eq.rts_alert = true;
				} else if (idNameMap[eq.trigger_view[0].id] > 2) {
					if (idNameMap[eq.trigger_view[1].id] > 0.5) eq.rts_alert = true;
					else if (idNameMap[eq.trigger_view[1].id] && idNameMap[eq.trigger_view[2].id]) eq.rts_alert = true;
				} else if ((idNameMap[eq.trigger_view[0].id] && idNameMap[eq.trigger_view[1].id]) || idNameMap[eq.trigger_view[0].id] && idNameMap[eq.trigger_view[2].id]) eq.rts_alert = true;
				else if (Object.keys(idNameMap).length > 2) eq.rts_alert = true;

				if (eq.rts_alert)
					if (config.side == "SERVER" && config.LOCATION == "臺南") {
						fetch(process.env.YUYU1015_WEBHOOK, {
							method  : "POST",
							headers : { "Content-Type": "application/json" },
							body    : JSON.stringify({
								content    : "https://media.discordapp.net/attachments/1080828445791101008/1232750955464884384/alert.gif",
								avatar_url : "https://github.com/whes1015.png",
								username   : "YuYu1015",
							}),
						})
							.catch(err => console.error(err));

						const loc = global_data.station_info[eq.trigger_view[0].id].info.at(-1);
						const Loc = search_loc(global_data, loc.code);
						const body = JSON.stringify({
							embeds: [
								{
									"title"       : `${Loc} 檢測到震動`,
									"description" : "",
									"color"       : 16753920,
									"fields"      : [
										{
											"name"   : "備註",
											"value"  : `[${formatTimestamp(eq.id)}] 左右 **${Loc}** 檢測到震動 稍後將提供更多資訊`,
											"inline" : false,
										},
									],
									"footer": {
										"text"     : `YuYu1015 | ${formatTime(global_data.time_now)}`,
										"icon_url" : "https://github.com/whes1015.png",
									},
								},
							],
							avatar_url : "https://github.com/whes1015.png",
							username   : "YuYu1015",
						});
						fetch(config.TREM_INTENSITY_WEBHOOK, {
							method  : "POST",
							headers : { "Content-Type": "application/json" },
							body    : {
								...body,
								content: "<@&1245668894056644650>",
							},
						})
							.catch(err => console.error(err));
						fetch(process.env.TREM_INTENSITY_WEBHOOK_2, {
							method  : "POST",
							headers : { "Content-Type": "application/json" },
							body    : {
								...body,
								content: "<@&1224889331999838280>",
							},
						})
							.catch(err => console.error(err));
					}
			}

			if (eq.rts_alert)
				for (const trigger of eq.group)
					if (global_data.data.rts.station[trigger.id])
						if (global_data.time_now - (global_data.rts[trigger.id]?.time ?? 0) < 30000) global_data.data.rts.station[trigger.id].alert = 1;
		}

		for (const id of Object.keys(global_data.data.rts.station)) {
			const _station_info = global_data.station_info[id].info[global_data.station_info[id].info.length - 1];
			if (!_station_info.code) continue;

			if (global_data.data.rts.station[id].alert) {
				let box_id = "";
				for (const box of box_info.features) {
					const polygon = turf.polygon(box.geometry.coordinates);
					const point = turf.point([_station_info.lon, _station_info.lat]);
					const isInside = turf.booleanPointInPolygon(point, polygon);
					if (isInside) {
						box_id = box.id;
						break;
					}
				}
				if (box_id != "") {
					if (!box_area[box_id]) box_area[box_id] = 0;
					if (box_area[box_id] < intensity_float_to_int(global_data.data.rts.station[id].I)) box_area[box_id] = intensity_float_to_int(global_data.data.rts.station[id].I);
				}

				const index = int.findIndex(item => item.code == _station_info.code);
				const I = intensity_float_to_int(global_data.data.rts.station[id].I);
				if (index != -1) {
					if (int[index].i < I) int[index].i = I;
				} else
					int.push({
						code : _station_info.code,
						i    : I,
					});
			}
		}
		int.sort((a, b) => b.i - a.i);
		global_data.data.rts.box = box_area;
		global_data.data.rts.time = global_data.time_now;
		global_data.data.rts.int = int;

		if (global_data.time_now) {
			const time_str = formatTime(global_data.time_now);
			if (config.side == "SERVER" && pool && rts_timestamp != time_str) writeToDatabase(time_str, global_data.data.rts);
		}
	}, 0);
};

async function writeToDatabase(Time, data) {
	rts_timestamp = Time;
	let conn;
	try {
		conn = await pool.getConnection();
		const insertQuery = `
        INSERT INTO rts (Time, Data)
        VALUES (?, ?);
        `;
		await conn.query(insertQuery, [Time, JSON.stringify(data)]);
	} catch (err) {
		console.log(err);
	} finally {
		if (conn) conn.release();
	}
}

function search_loc(global_data, int) {
	for (const city of Object.keys(global_data.region))
		for (const town of Object.keys(global_data.region[city]))
			if (global_data.region[city][town].code == int)
				return city + town;

	return undefined;
}