const config = require("../config");
const { formatTime, distance, speed, findClosestIds, intensity_float_to_int, emoji_str } = require("../utils/utils");
const fs = require("fs-extra");

const mariadb = require("mariadb");

const pool = mariadb.createPool({
	host            : "mariadb",
	user            : "root",
	password        : process.env.DB_PASSWORD,
	database        : "exptech",
	connectionLimit : 5,
});

const levels = [0.6, 0.5, 0.4, 0.3, 0.2];

const trigger_level = {
	1480496  : 0.25,
	11334680 : 3.6,
	11334880 : 0.19,
	11337052 : 2.09,
};


module.exports = (global_data, logger) => {
	setInterval(() => {
		for (let _i = global_data.eq_group.length - 1; _i >= 0; _i--) {
			const eq = global_data.eq_group[_i];
			let max = 0;
			for (const station of eq.group) {
				const intensity = intensity_float_to_int(station.i);
				if (intensity > max) max = intensity;
			}

			let skip = false;

			const target = global_data.eq_group.reduce((_max, item) =>
				(item.group.length > _max.group.length ? item : _max), global_data.eq_group[0]);

			if (global_data.eq_group.length > 1 && target) {
				const targetTime = target.id;
				const targetLat = target.eew.lat;
				const targetLng = target.eew.lon;

				if (target.id != eq.id && targetLat && targetLng) {
					const nearbyIndex = findNearbyIndex(global_data, targetTime, targetLat, targetLng);
					if (nearbyIndex != -1 && global_data.data.eew[nearbyIndex].id == eq.id) skip = true;
				}
			}

			if ((skip || !eq.alert || (eq.alert && max >= 2 && !eq.rts_alert && eq.group.length < 4)) && global_data.time_now - eq.id > 7500) {
				for (const trigger_station of eq.group) {
					if (trigger_station.i < 0.5) continue;
					global_data.freeze_station[trigger_station.id] = global_data.time_now + 90000 * trigger_station.i;
					const sec = Math.floor((90000 * trigger_station.i) / 1000);
					logger.warn(`${formatTime(global_data.time_now)} freeze ${trigger_station.id} ${sec}s`);

					if (config.side == "SERVER")
						webhook(process.env.FREEZE_WEBHOOK, {
							"username"   : "ExpTech | 探索科技 (測試)",
							"avatar_url" : "https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/ExpTech.jpg",
							"embeds"     : [
								{
									"title"       : `${trigger_station.id} 自動凍結`,
									"description" : "",
									"color"       : 16711680,
									"fields"      : [
										{
											"name"   : "凍結時間",
											"value"  : `${sec} 秒`,
											"inline" : false,
										},
										{
											"name"   : "單位",
											"value"  : `${config.LOCATION}`,
											"inline" : false,
										},
									],
									"footer": {
										"text"     : `ExpTech Studio 2023 | ${formatTime(global_data.time_now)}`,
										"icon_url" : "https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/ExpTech.jpg",
									},
								},
							],
						});

				}

				if (eq.alert) {
					const index = global_data.data.eew.findIndex(item => item.id == eq.id);
					if (index != -1 && !global_data.data.eew[index].final) {
						eq.eew.status = 3;
						eq.eew.max = 0;
						eq.eew.area = {};

						global_data.data.eew[index].eq.max = 0;
						global_data.data.eew[index].final = 1;
						global_data.data.eew[index].level = 2;
						global_data.data.eew[index].status = 3;
						global_data.data.eew[index].reason = 5;
						global_data.data.eew[index].eq.area = {};
						global_data.data.eew[index].serial++;
						global_data.broadcast({
							type    : "data",
							key     : process.env.WS_KEY,
							version : 1,
							data    : {
								type    : "eew",
								author  : "trem",
								detail  : global_data.data.eew[index].detail,
								level   : global_data.data.eew[index].level,
								id      : eq.id,
								serial  : global_data.data.eew[index].serial,
								status  : global_data.data.eew[index].status,
								reason  : global_data.data.eew[index].reason,
								final   : global_data.data.eew[index].final,
								trigger : eq.group.length,
								rts     : eq.rts_alert,
								eq      : {
									time  : global_data.data.eew[index].eq.time,
									lon   : global_data.data.eew[index].eq.lon,
									lat   : global_data.data.eew[index].eq.lat,
									depth : global_data.data.eew[index].eq.depth,
									mag   : global_data.data.eew[index].eq.mag,
									loc   : global_data.data.eew[index].eq.loc,
									max   : global_data.data.eew[index].eq.max,
									area  : global_data.data.eew[index].eq.area,
									acc   : "/////",
								},
							},
							time: global_data.time_now,
						});

						logger.warn(`earthquake cancel => ${eq.id}`);
						console.log(eq);

						fs.appendFile(`./csv/${eq.id}-${config.mode}.csv`, `${formatTime(global_data.time_now)},trem,${global_data.data.eew[index].serial},${global_data.data.eew[index].status},${global_data.data.eew[index].level},${global_data.data.eew[index].detail},${global_data.data.eew[index].reason},${global_data.data.eew[index].trigger},${global_data.data.eew[index].eq.lon},${global_data.data.eew[index].eq.lat},${global_data.data.eew[index].eq.depth},${global_data.data.eew[index].eq.mag},${global_data.data.eew[index].eq.loc},${global_data.data.eew[index].eq.max},${global_data.data.eew[index].eq.acc.join("")},${global_data.data.eew[index].eq.skip}\n`, () => void 0);
						if (config.side == "SERVER") {
							if (global_data.file.cache.day != new Date().getDate()) {
								global_data.file.cache.day = new Date().getDate();
								global_data.file.cache.count = 1;
							}
							const time = formatTime(eq.id);
							global_data.eq_report_list.push({
								eq,
								dc: {
									"username"   : "ExpTech | 探索科技",
									"avatar_url" : "https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/ExpTech.jpg",
									"embeds"     : [
										{
											"author": {
												"name": `📝 檢知報告 | ${time.split(" ")[0]}_${global_data.file.cache.count.toString().padStart(3, "0")}`,
											},
											"title"       : `${time.replaceAll("-", "").replaceAll(":", "").replace(" ", "")}`,
											"description" : `${time}(<t:${Math.round(eq.id / 1000)}:R>)\n\n**最大震度** ${emoji_str(max)}\n\n**觸發站數** ${eq.group.length}\n\n[點我前往](https://${(config.LOCATION == "臺南") ? "api-1" : "api-2"}.exptech.dev/file/trem_info.html?id=${eq.id})\n\n僅供參考\n實際結果依 中央氣象局 公布之內容為準`,
											"color"       : 8421504,
											"footer"      : {
												"text"     : `ExpTech Studio 2023 | ${formatTime(global_data.time_now)}`,
												"icon_url" : "https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/ExpTech.jpg",
											},
										},
									],
								} });
							global_data.file.cache.count++;
							global_data.file_status.cache = true;
						}

						if (config.side == "SERVER") {
							const idList = eq.group.map(item => `${item.first_time}-${item.id}`);
							writeToTremReport(logger, {
								ID          : eq.id,
								Serial      : global_data.data.eew[index].serial,
								Source      : config.LOCATION,
								Cwa_id      : null,
								Loc         : global_data.data.eew[index].eq.loc,
								Lat         : global_data.data.eew[index].eq.lat,
								Lon         : global_data.data.eew[index].eq.lon,
								Depth       : global_data.data.eew[index].eq.depth,
								Mag         : global_data.data.eew[index].eq.mag,
								Max         : global_data.data.eew[index].eq.max,
								Lpgm        : null,
								Alarm       : (eq.rts_alert) ? 1 : 0,
								False_alarm : null,
								Cancel      : 1,
								Triggered   : eq.group.length,
								List        : JSON.stringify(idList),
							});
						}

						setTimeout(() => global_data.data.eew.splice(index, 1), 5000);
					}

					delete eq.send;
					delete eq.eew;
					delete eq.intensity;
					delete eq.trigger_view;
					delete eq.alert;
					delete eq.eew_lock;
					for (const station of eq.group)
						delete station.net;

					global_data.file.eq.push(eq);
					global_data.file_status.eq = true;
				}

				global_data.eq_group.splice(_i, 1);
				continue;
			}
		}

		global_data.station_alert_list.sort((a, b) => a.first_time - b.first_time);

		for (let i = global_data.station_alert_list.length - 1; i >= 0; i--) {
			const trigger = global_data.station_alert_list[i];
			if (global_data.time_now - trigger.last_time > 15000) {
				const pga_i = Number((2 * Math.log10(trigger.pga) + 0.7).toFixed(1));
				const pgv_i = Number((2.14 * Math.log10(trigger.pgv) + 1.89).toFixed(1));
				if (intensity_float_to_int(pga_i) >= 4 && intensity_float_to_int(pgv_i) > 4)
					trigger.i = pgv_i;
				else {
					trigger.i = pga_i;
					const I = intensity_float_to_int(pga_i);
					if (I > 4) trigger.i = 4.4;
					else if (I > 1 && trigger.pga < 5 && trigger.net == "SE-Net") trigger.i = 1.4;
				}

				global_data.wave_list.push({
					time : trigger.last_time + 50000,
					data : {
						start   : formatTime(trigger.first_time - 15000),
						end     : formatTime(trigger.last_time + 45000),
						id      : trigger.id,
						wave_id : `${trigger.first_time}-${trigger.id}`,
						alert   : false,
						info    : {
							i   : trigger.i,
							pga : trigger.pga,
							pgv : trigger.pgv,
							ax  : trigger.a_x,
							ay  : trigger.a_y,
							az  : trigger.a_z,
							vx  : trigger.v_x,
							vy  : trigger.v_y,
							vz  : trigger.v_z,
						},
					},
				});
				global_data.station_alert_list.splice(i, 1);
				continue;
			}

			if (global_data.freeze_station[trigger.id]) continue;

			let find = false;
			for (let _i = global_data.eq_group.length - 1; _i >= 0; _i--) {
				const eq = global_data.eq_group[_i];

				const index = eq.trigger_view.findIndex(item => item.id == trigger.id);
				if (index != -1) {
					const _i_ = eq.group.findIndex(item => item.id == trigger.id);
					if (_i_ != -1)
						if (eq.group[_i_].first_time == trigger.first_time) {
							if (eq.last_time < trigger.last_time) eq.last_time = trigger.last_time;
							eq.group[_i_] = trigger;
							find = true;
							break;
						} else continue;
					else {
						if (global_data.time_now - eq.id > 15000) continue;
						eq.group.push(trigger);
					}

					eq.trigger_view[index].alert = true;

					if (eq.last_time < trigger.last_time) eq.last_time = trigger.last_time;

					let total_level = 0;
					for (const trigger_view_id of eq.trigger_view)
						if (trigger_view_id.alert) total_level += trigger_view_id.level;

					const Code = global_data.station_info[trigger.id].info.at(-1).code;
					if (total_level >= 1.5 || (trigger.net == "MS-Net" && trigger.pga > ((trigger_level[trigger.id]) ? trigger_level[trigger.id] : 0.15) && Code)) {
						if (!eq.alert) {
							logger.warn(`${formatTime(global_data.time_now)} earthquake detected !!! => ${eq.id}`);

							eq.group.sort((a, b) => a.first_time - b.first_time);
							const first = global_data.station_info[eq.group[0].id].info;
							const first_loc = first[first.length - 1];
							eq.eew.lat = Number(first_loc.lat.toFixed(2));
							eq.eew.lon = Number(first_loc.lon.toFixed(2));
							eq.eew.time = eq.group[0].first_time - 10000;
							eq.search.lat = Number(first_loc.lat.toFixed(2));
							eq.search.lon = Number(first_loc.lon.toFixed(2));
							eq.search.time = eq.group[0].first_time - 10000;
							eq.search.f_lat = Number(first_loc.lat.toFixed(2));
							eq.search.f_lon = Number(first_loc.lon.toFixed(2));
							eq.search.f_time = eq.group[0].first_time - 10000;
						}
						eq.alert = true;
					}

					find = true;
					break;
				} else {
					const _i_ = eq.group.findIndex(item => item.id == trigger.id);
					if (_i_ != -1)
						if (eq.group[_i_].first_time == trigger.first_time) {
							if (eq.last_time < trigger.last_time) eq.last_time = trigger.last_time;
							eq.group[_i_] = trigger;
							find = true;
							break;
						}
					continue;
				}
			}
			if (find) continue;

			for (let _i = global_data.eq_group.length - 1; _i >= 0; _i--) {
				const eq = global_data.eq_group[_i];
				if (!eq.alert) continue;

				const index = eq.group.findIndex(item => item.id == trigger.id);
				if (index != -1) {
					find = true;
					continue;
				}

				if (trigger.first_time - eq.group[0].first_time > 15000) continue;

				const first = global_data.station_info[eq.group[0].id].info;
				const first_loc = first[first.length - 1];
				const target = global_data.station_info[trigger.id].info;
				const target_loc = target[target.length - 1];

				const dis = distance(target_loc.lat, target_loc.lon)(first_loc.lat, first_loc.lon);
				if (dis < 105) {
					if (eq.last_time < trigger.last_time) eq.last_time = trigger.last_time;
					eq.group.push(trigger);
					find = true;
					break;
				}
			}
			if (find) continue;

			for (let _i = global_data.eq_group.length - 1; _i >= 0; _i--) {
				const eq = global_data.eq_group[_i];
				if (!eq.alert) continue;

				const index = eq.group.findIndex(item => item.id == trigger.id);
				if (index != -1) {
					find = true;
					continue;
				}

				const target = global_data.station_info[trigger.id].info;
				const target_loc = target[target.length - 1];
				const dis = distance(target_loc.lat, target_loc.lon)(eq.eew.lat, eq.eew.lon);
				const tr = speed(eq.eew.depth, dis);

				const p_arrive = eq.eew.time + tr.Ptime * 1000;
				const s_arrive = eq.eew.time + tr.Stime * 1000;
				if (Math.abs(p_arrive - trigger.first_time) < 10000 || Math.abs(trigger.first_time - s_arrive) < 20000) {
					if (eq.last_time < trigger.last_time) eq.last_time = trigger.last_time;
					eq.group.push(trigger);
					find = true;
					break;
				}
			}
			if (find) continue;

			if (!global_data.station_info[trigger.id]) continue;
			const id_list = findClosestIds(global_data, trigger.id);
			const trigger_view = id_list.slice(0, 5).map((id, index) => ({
				id    : id,
				alert : false,
				level : levels[index],
			}));
			trigger_view.unshift({
				id    : trigger.id,
				alert : true,
				level : 1,
			});
			const Alert = global_data.eq_group.some(item =>
				item.alert == true && item.eew.level != 2);
			global_data.eq_group.push({
				alert     : false,
				final     : false,
				eew_lock  : Alert,
				rts_alert : false,
				last_time : global_data.time_now,
				id        : global_data.time_now + Math.floor(Math.random() * 15) + 1,
				eew       : {
					lat        : 0,
					lon        : 0,
					depth      : 10,
					mag        : 1,
					time       : 0,
					max        : 0,
					level      : 0,
					count_time : 0,
					area       : {},
					detail     : 0,
					status     : 0,
					lock       : false,
					serial     : 0,
					skip       : 0,
					acc        : ["1", "1", "1", "1", "1"],
				},
				search: {
					f_lat  : 0,
					f_lon  : 0,
					f_time : 0,
					lat    : 0,
					lon    : 0,
					depth  : 10,
					mag    : 1,
					time   : 0,
					level  : 0,
				},
				intensity: {
					serial : 0,
					time   : 0,
					final  : 0,
				},
				send: {
					lat         : 0,
					lon         : 0,
					depth       : 0,
					mag         : 0,
					time        : 0,
					area        : {},
					check_time  : 0,
					timestamp   : 0,
					check_count : 0,
					gif         : false,
					max         : 0,
					area_count 	: 0,
				},
				trigger_view,
				group: [],
			});
		}
	}, 0);
};

function findNearbyIndex(global_data, targetTime, targetLat, targetLng) {
	return global_data.data.eew.findIndex(item => {
		if (item.id == targetTime) return false;
		const timeDiff = Math.abs(item.eq.time - targetTime);
		const calcDistance = distance(targetLat, targetLng)(item.eq.lat, item.eq.lon);
		return timeDiff <= 15000 && calcDistance <= 30;
	});
}

async function writeToTremReport(logger, data) {
	let conn;
	try {
		conn = await pool.getConnection();
		const insertQuery = `
            INSERT INTO trem_report (
                ID, Serial, Source, Cwa_id, Loc,
                Lat, Lon, Depth, Mag, Max, Lpgm, Alarm, False_alarm, Cancel, Triggered,List
            ) VALUES (
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            );
        `;
		const values = [
			data.ID, data.Serial, data.Source, data.Cwa_id, data.Loc,
			data.Lat, data.Lon, data.Depth, data.Mag, data.Max, data.Lpgm, data.Alarm, data.False_alarm, data.Cancel, data.Triggered, data.List,
		];
		await conn.query(insertQuery, values);
	} catch (err) {
		logger.error("1" + err);
	} finally {
		if (conn) conn.release();
	}
}

function webhook(url, body) {
	fetch(url, {
		method  : "POST",
		headers : { "Content-Type": "application/json" },
		body    : JSON.stringify(body),
	})
		.then(response => response.text())
		.catch(err => console.error(err));
}