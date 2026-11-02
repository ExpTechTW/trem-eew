const config = require("../config");
const { formatTime, emoji_str, intensity_float_to_int, distance, pga_to_intensity, pga_to_float, speed, eew_location_intensity, intensity_int_to_string } = require("../utils/utils");

const { fork } = require("child_process");
const fs = require("fs-extra");
const d3 = require("d3");
const mariadb = require("mariadb");
const puppeteer = require("puppeteer");
const path = require("path");

const { ThreadsAPI } = require("threads-api");

const threadsAPI = new ThreadsAPI({
	username : process.env.THREADS_USERNAME,
	password : process.env.THREADS_PASSWORD,
});

const child = fork(require.resolve("./search"), { windowsHide: true });

const { TwitterApi } = require("twitter-api-v2");

const twitterClient = new TwitterApi({
	appKey       : process.env.TWITTER_APP_KEY,
	appSecret    : process.env.TWITTER_APP_SECRET,
	accessToken  : process.env.TWITTER_ACCESS_TOKEN,
	accessSecret : process.env.TWITTER_ACCESS_SECRET,
});

const rwClient = twitterClient.readWrite;

const pool = mariadb.createPool({
	host            : "mariadb",
	user            : "root",
	password        : process.env.DB_PASSWORD,
	database        : "exptech",
	connectionLimit : 5,
});

const csv_data = {};

// Helper function to write CSV files in new structure
function writeCsvData(eq_id, serial, eew_data, station_data, eew_search_data) {
	const csv_dir = `./csv/${eq_id}`;
	const station_dir = `${csv_dir}/station`;
	const eew_dir = `${csv_dir}/eew`;

	// Ensure directories exist
	fs.ensureDirSync(csv_dir);
	fs.ensureDirSync(station_dir);
	fs.ensureDirSync(eew_dir);

	// Write or append to eew.csv
	const eew_path = `${csv_dir}/eew.csv`;
	const eew_csv_line = `${eew_data.time},${eew_data.author},${eew_data.serial},${eew_data.status},${eew_data.level},${eew_data.detail},${eew_data.reason},${eew_data.trigger},${eew_data.lon},${eew_data.lat},${eew_data.depth},${eew_data.mag},${eew_data.loc},${eew_data.max},${eew_data.acc},${eew_data.skip}\n`;

	if (!fs.existsSync(eew_path))
		fs.writeFileSync(eew_path, "time,author,serial,status,level,detail,reason,triggered,lon,lat,depth,mag,loc,max,acc,skip\n" + eew_csv_line);
	else
		fs.appendFileSync(eew_path, eew_csv_line);

	// Write station data for this serial
	if (station_data && station_data.length > 0) {
		const station_path = `${station_dir}/${serial}.csv`;
		let station_csv = "id,net,lat,lon,first_time,max_time,pick_p,a_z,pga,pgv,eq_t,weight,distance,p_time,s_time\n";

		for (const station of station_data)
			station_csv += `${station.id},${station.net},${station.lat},${station.lon},${station.first_time},${station.max_time},${station.pick_p},${station.a_z},${station.pga},${station.pgv},${station.eq_t},${station.weight},${station.distance},${station.p_time},${station.s_time}\n`;

		fs.writeFileSync(station_path, station_csv);
	}

	// Write eew search data for this serial
	if (eew_search_data && eew_search_data.length > 0) {
		const eew_search_path = `${eew_dir}/${serial}.csv`;
		let eew_search_csv = "lat,lon,depth,count,time\n";

		for (const item of eew_search_data)
			eew_search_csv += `${item.lat},${item.lon},${item.depth},${item.count},${item.time}\n`;

		fs.writeFileSync(eew_search_path, eew_search_csv);
	}
}

let intensity_cache = {
	id     : 0,
	alert  : 0,
	serial : 0,
	final  : 0,
	area   : {},
	max    : 0,
	time   : 0,
	group  : [],
};

async function captureMap(EQ) {
	const browser = await puppeteer.launch({
		executablePath  : process.env.PUPPETEER_EXECUTABLE_PATH,
		args            : ["--no-sandbox", "--disable-setuid-sandbox"],
		protocolTimeout : 60000,
	});

	const page = await browser.newPage();
	await page.setViewport({ width: 1038, height: 691 });

	const absolutePath = "file://" + path.resolve("./core/images/intensity.html");
	await page.evaluateOnNewDocument((eq) => {
		// eslint-disable-next-line no-undef
		window.EQ = eq;
	}, EQ);
	await page.goto(absolutePath);
	await page.waitForSelector("#map");

	await page.screenshot({
		path     : (config.side == "LOCAL") ? `./intensity/${EQ.intensity.data.id}-${EQ.intensity.data.serial}.jpg` : `/images/intensity/${EQ.intensity.data.id}-${EQ.intensity.data.serial}.jpg`,
		fullPage : true,
		type     : "jpeg",
		quality  : 100,
	});

	await browser.close();
}

module.exports = (global_data, logger) => {
	setInterval(async () => {
		if (!global_data.eq_group.length) return;

		for (let i = global_data.eq_group.length - 1; i >= 0; i--) {
			const eq = global_data.eq_group[i];
			if (eq.alert && !eq.final) {
				for (const trigger of eq.group)
					if (!global_data.wave_alert_list.includes(`${trigger.first_time}-${trigger.id}`)) global_data.wave_alert_list.push(`${trigger.first_time}-${trigger.id}`);

				if (global_data.time_now - eq.last_time > 30000) {
					let max = 0;

					for (const trigger of eq.group) {
						const intensity = intensity_float_to_int(trigger.i);
						if (intensity > max) max = intensity;
					}

					eq.final = true;
					logger.warn(`earthquake final => ${eq.id}`);
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
										"color"       : (!eq.rts_alert) ? 65280 : 8388736,
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

					if (eq.intensity.time) {
						eq.intensity.final = 1;
						eq.intensity.time = global_data.time_now;
						const intensity_list = intensity_report(global_data, eq.group, global_data.station_info);
						let mag = 0;
						for (let _i = global_data.eq_group.length - 1; _i >= 0; _i--) {
							const _eq = global_data.eq_group[_i];
							if (_eq.id == eq.id) {
								mag = _eq.mag;
								break;
							}
						}
						let end = true;
						for (let _i = global_data.eq_group.length - 1; _i >= 0; _i--) {
							const _eq = global_data.eq_group[_i];
							if (!_eq.rts_alert) continue;
							if (_eq.intensity.final == 0) {
								end = false;
								break;
							}
						}
						if (end) {
							if (!intensity_cache.alert && mag > 4.5) intensity_cache.alert = 1;
							intensity_cache.serial++;
							intensity_cache.area = mergeIntensityReports(intensity_cache.area, intensity_list);
							const _max = findMaxKey(intensity_list);
							if (_max > intensity_cache.max) intensity_cache.max = _max;
							const data = {
								type    : "data",
								key     : process.env.WS_KEY,
								version : 1,
								data    : {
									type   : "intensity",
									author : "trem",
									id     : intensity_cache.id,
									alert  : intensity_cache.alert,
									serial : intensity_cache.serial,
									final  : 1,
									area   : intensity_cache.area,
									max    : intensity_cache.max,
								},
								time: global_data.time_now,
							};

							intensity_cache.group = updateGroups(intensity_cache.group, eq.group);

							await captureMap({
								station_info : global_data.station_info,
								intensity    : data,
								group        : intensity_cache.group,
							});
							if (config.LOCATION == "臺南") intensity_dc(data);
							global_data.broadcast(data);

							const index = global_data.data.intensity.findIndex(item => item.id == data.data.id);

							if (index !== -1) global_data.data.intensity[index] = data.data;
							else global_data.data.intensity.push(data.data);

							intensity_cache = {
								id     : 0,
								alert  : 0,
								serial : 0,
								final  : 0,
								area   : {},
								max    : 0,
								time   : 0,
								group  : [],
							};

							setTimeout(() => global_data.data.intensity = global_data.data.intensity.filter(item => item.id != data.data.id), 60000);
						}
					}

					const index = global_data.data.eew.findIndex(item => item.id == eq.id);
					if (index != -1) {
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
								Cancel      : 0,
								Triggered   : eq.group.length,
								List        : JSON.stringify(idList),
							});
						}
						global_data.data.eew.splice(index, 1);
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

					global_data.eq_group.splice(i, 1);
					continue;
				}

				if (eq.rts_alert && eq.group.length > 1) {
					let max = 0;

					for (const trigger of eq.group) {
						const intensity = intensity_float_to_int(trigger.i);
						if (intensity > max) max = intensity;
					}

					if (max) {
						const intensity_list = intensity_report(global_data, eq.group, global_data.station_info);
						if (Object.keys(intensity_list).length) {
							eq.intensity.time = global_data.time_now;
							let mag = 0;
							for (let _i = global_data.eq_group.length - 1; _i >= 0; _i--) {
								const _eq = global_data.eq_group[_i];
								if (_eq.id == eq.id) {
									mag = _eq.mag;
									break;
								}
							}
							if (!intensity_cache.id) intensity_cache.id = eq.id;
							if (!intensity_cache.alert && mag > 4.5) intensity_cache.alert = 1;
							intensity_cache.area = mergeIntensityReports(intensity_cache.area, intensity_list);
							const _max = findMaxKey(intensity_list);
							if (_max > intensity_cache.max) intensity_cache.max = _max;
							if (global_data.time_now - intensity_cache.id > 15000 && global_data.time_now - intensity_cache.time > 30000) {
								intensity_cache.time = global_data.time_now;
								intensity_cache.serial++;
								const data = {
									type    : "data",
									key     : process.env.WS_KEY,
									version : 1,
									data    : {
										type   : "intensity",
										author : "trem",
										id     : intensity_cache.id,
										alert  : intensity_cache.alert,
										serial : intensity_cache.serial,
										final  : 0,
										area   : intensity_cache.area,
										max    : intensity_cache.max,
									},
									time: global_data.time_now,
								};

								intensity_cache.group = updateGroups(intensity_cache.group, eq.group);

								await captureMap({
									station_info : global_data.station_info,
									intensity    : data,
									group        : intensity_cache.group,
								});
								if (config.LOCATION == "臺南") intensity_dc(data);
								global_data.broadcast(data);

								const index = global_data.data.intensity.findIndex(item => item.id == data.data.id);

								if (index !== -1) global_data.data.intensity[index] = data.data;
								else global_data.data.intensity.push(data.data);
							}
						}
					}
				}
			}

			if (!eq.alert || eq.last_time == eq.eew.count_time || eq.eew.level == 2 || eq.eew.status == 3 || eq.eew.lock) continue;
			eq.eew.count_time = eq.last_time;
			eq.eew.lock = true;
			child.send({
				eq,
				global_data,
			});
		}
	}, 0);

	child.on("message", (result) => {
		const { eq, area, max, lat, lon, depth, mag, time, detail, level, skip, acc, station_data, eew_search_data } = result;

		for (let i = global_data.eq_group.length - 1; i >= 0; i--) {
			if (global_data.eq_group[i].id !== eq.id) continue;

			global_data.eq_group[i].eew.serial++;

			let old_skip = 0;
			const old_squared_errors = [];

			if (global_data.eq_group[i].search.level) {
				const search_list = findClosestIds(global_data.station_info, global_data.eq_group[i].search.lat, global_data.eq_group[i].search.lon, Object.keys(global_data.station_info));

				const stationObj = {};
				for (const s of eq.group)
					stationObj[s.id] = s.pga;

				for (const station of search_list) {
					const info = global_data.station_info[station].info.at(-1);
					const dist_surface = distance(global_data.eq_group[i].search.lat, global_data.eq_group[i].search.lon)(info.lat, info.lon);
					const tr = speed(global_data.eq_group[i].search.depth, dist_surface);
					const dist = Math.sqrt(dist_surface ** 2 + global_data.eq_group[i].search.depth ** 2);
					const e_pga = 1.657 * Math.exp(1.533 * global_data.eq_group[i].search.mag) * Math.pow(dist, -1.607);

					const r_pga = stationObj[station] || 0;

					if (global_data.time_now > global_data.eq_group[i].search.time + tr.Stime * 1000) {
						// S波RMS計算：實際值與預期值的誤差平方
						const error = Math.abs(r_pga - e_pga);
						old_squared_errors.push(error * error);
					} else if (global_data.station_info[station].net === "MS-Net" &&
								global_data.time_now > global_data.eq_group[i].search.time + tr.Ptime * 1000 && e_pga > 0.5)
						// P波RMS計算：對於應該觸發但未觸發的測站
						if (r_pga === 0) {
							const error = e_pga;
							old_squared_errors.push(error * error);
						}

				}

				// 計算舊參數的RMS（使用IQR方法去除極值）
				if (old_squared_errors.length > 0) {
					// 先開平方根得到誤差值
					const errors = old_squared_errors.map(sq => Math.sqrt(sq));
					errors.sort((a, b) => a - b);

					let trimmed_errors;
					if (errors.length <= 4)
						// 數據太少，使用全部
						trimmed_errors = errors;
					else {
						// 使用四分位數範圍內的數據（去除上下各25%）
						const q1_index = Math.floor(errors.length * 0.25);
						const q3_index = Math.ceil(errors.length * 0.75);
						trimmed_errors = errors.slice(q1_index, q3_index);
					}

					// 重新計算平方和RMS
					const trimmed_squared = trimmed_errors.map(e => e * e);
					const mean_squared_error = trimmed_squared.reduce((sum, sq) => sum + sq, 0) / trimmed_squared.length;
					old_skip = Math.sqrt(mean_squared_error);
				} else
					old_skip = 0;

			}

			if ((old_skip > skip && skip < 50) || (!global_data.eq_group[i].search.level && skip < 50)) {
				if (detail) global_data.eq_group[i].search.level = 1;

				Object.assign(global_data.eq_group[i].search, { mag, lat, lon, depth, time });
				Object.assign(global_data.eq_group[i].eew, { skip, mag, lat, lon, depth, time, acc });

				if (detail && !global_data.eq_group[i].eew.detail)
					global_data.eq_group[i].eew.detail = detail;

				if (level && !global_data.eq_group[i].eew.level)
					global_data.eq_group[i].eew.level = level;

				logger.warn(`[EEW Ans] => ${eq.id} - ${skip}/${old_skip} ${mag} ${lat} ${lon} ${depth} ${detail}`);
			} else if (skip && skip > 70 && mag) {
				global_data.eq_group[i].eew.mag = 0;
				global_data.eq_group[i].eew.depth = 0;
				global_data.eq_group[i].eew.skip = skip;
			} else
				logger.warn(`[EEW Skip] => ${eq.id} - ${skip}/${old_skip} ${mag} ${lat} ${lon} ${depth} ${detail}`);

			const eew_area = eew_location_intensity(
				global_data.region,
				global_data.eq_group[i].eew.lat,
				global_data.eq_group[i].eew.lon,
				global_data.eq_group[i].eew.depth,
				global_data.eq_group[i].eew.mag,
			);

			const _max = Math.max(...Object.values(eew_area));
			global_data.eq_group[i].eew.max = Math.max(max, _max);

			const new_area = {};
			for (const key in eew_area)
				if (area[key] && area[key] > eew_area[key])
					new_area[key] = area[key];

			global_data.eq_group[i].eew.area = new_area;

			const _status = global_data.eq_group[i].eew.max > 4 ? 1 : 0;
			if (!global_data.eq_group[i].eew.status && _status)
				global_data.eq_group[i].eew.status = _status;

			// Store station_data for this update
			if (station_data && station_data.length > 0)
				global_data.eq_group[i].eew.station_data = station_data;

			// Store eew_search_data for this update
			if (eew_search_data && eew_search_data.length > 0)
				global_data.eq_group[i].eew.eew_search_data = eew_search_data;

			global_data.eq_group[i].eew.lock = false;
			break;
		}
	});

	setInterval(() => {
		if (!global_data.eq_group.length) return;

		for (let i = global_data.eq_group.length - 1; i >= 0; i--) {
			const eq = global_data.eq_group[i];
			if (!eq.alert) continue;
			if (eq.eew.final) continue;
			const index = global_data.data.eew.findIndex(item => item.id == eq.id);
			if (index != -1) {
				if (!eq.eew.mag && eq.send.mag == eq.eew.mag) continue;
				let reason = 0;
				if (eq.eew.lat != eq.send.lat) reason = 1;
				else if (eq.eew.lon != eq.send.lon) reason = 1;
				else if (eq.eew.depth != eq.send.depth) reason = 1;
				else if (eq.eew.mag != eq.send.mag) reason = 2;
				else if (eq.eew.time != eq.send.time) reason = 1;
				else if (!areObjectsEqual(eq.eew.area, eq.send.area)) reason = 3;

				if (reason) {
					eq.send.lat = eq.eew.lat;
					eq.send.lon = eq.eew.lon;
					eq.send.depth = eq.eew.depth;
					eq.send.time = eq.eew.time;
					eq.send.mag = eq.eew.mag;
					eq.send.area = eq.eew.area;
					eq.send.timestamp = global_data.time_now;
					eq.send.check_count = 0;

					global_data.data.eew[index].serial++;
					global_data.data.eew[index].status = (!eq.eew.mag) ? 3 : eq.eew.status;
					global_data.data.eew[index].level = eq.eew.level;
					global_data.data.eew[index].detail = eq.eew.detail;
					global_data.data.eew[index].reason = (!eq.eew.mag) ? 5 : reason;
					global_data.data.eew[index].trigger = eq.group.length;
					global_data.data.eew[index].rts = eq.rts_alert;
					global_data.data.eew[index].eq.time = eq.eew.time;
					global_data.data.eew[index].eq.lon = eq.eew.lon;
					global_data.data.eew[index].eq.lat = eq.eew.lat;
					global_data.data.eew[index].eq.acc = eq.eew.acc;
					global_data.data.eew[index].eq.depth = eq.eew.depth;
					global_data.data.eew[index].eq.skip = eq.eew.skip;
					global_data.data.eew[index].eq.mag = eq.eew.mag;
					global_data.data.eew[index].eq.loc = global_data.loc_search(eq.eew.lon, eq.eew.lat);
					global_data.data.eew[index].eq.max = (!eq.eew.mag) ? 0 : eq.eew.max;
					global_data.data.eew[index].eq.area = (!eq.eew.mag) ? {} : invertObjectAndGroupKeys(eq.eew.area);

					if (global_data.data.eew[index].eq.loc.endsWith("海")) {
						global_data.data.eew[index].eq.acc[0] = "9";
						global_data.data.eew[index].eq.acc[1] = "9";
					}

					if (eq.group.length > 30) global_data.data.eew[index].eq.acc[4] = "9";

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
							reason,
							final   : 0,
							trigger : eq.group.length,
							rts     : eq.rts_alert,
							acc     : (!global_data.data.eew[index].eq.mag) ? "/////" : global_data.data.eew[index].eq.acc.join(""),
							eq      : {
								time  : global_data.data.eew[index].eq.time,
								lon   : global_data.data.eew[index].eq.lon,
								lat   : global_data.data.eew[index].eq.lat,
								depth : global_data.data.eew[index].eq.depth,
								mag   : global_data.data.eew[index].eq.mag,
								loc   : global_data.data.eew[index].eq.loc,
								max   : global_data.data.eew[index].eq.max,
								area  : global_data.data.eew[index].eq.area,
							},
						},
						time: global_data.time_now,
					});

					if (config.side == "SERVER" && config.LOCATION == "臺南") {
						if (!eq.send.gif && eq.eew.max > 2) {
							eq.send.gif = true;
							fetch(process.env.YUYU1015_WEBHOOK, {
								method  : "POST",
								headers : { "Content-Type": "application/json" },
								body    : JSON.stringify({
									content    : "https://tenor.com/view/megumin-explosion-gif-20357859",
									avatar_url : "https://github.com/whes1015.png",
									username   : "YuYu1015",
								}),
							})
								.catch(err => console.error(err));
						}

						let count = 0;
						for (const key in global_data.data.eew[index].eq.area)
							count += global_data.data.eew[index].eq.area[key].length;

						if (eq.send.max != eq.eew.max || eq.send.area_count != count) {
							eq.send.max = eq.eew.max;
							eq.send.area_count = count;
							const emoji = emoji_str(eq.send.max);

							fetch(process.env.YUYU1015_WEBHOOK, {
								method  : "POST",
								headers : { "Content-Type": "application/json" },
								body    : JSON.stringify({
									avatar_url : "https://github.com/whes1015.png",
									username   : "YuYu1015",
									embeds     : [
										{
											"title"       : `TREM EEW | 第 ${global_data.data.eew[index].serial} 報`,
											"description" : "",
											"color"       : (eq.send.max < 4) ? 16753920 : 16711680,
											"fields"      : [
												{
													"name"   : "預估最大震度",
													"value"  : emoji,
													"inline" : true,
												},
												{
													"name"   : "ID",
													"value"  : "`" + eq.id + "`",
													"inline" : true,
												},
												(count > 4) && {
													"name"   : "注意",
													"value"  : "`預估震度` 與 `實際震度` 不符，已由 `NSSPE` 主導 `預估震度` 推算",
													"inline" : false,
												},
												{
													"name"   : "備註",
													"value"  : "此 資訊 為 TREM 系統 `自動觀測結果` 未經人為檢視確認 `僅供參考`",
													"inline" : false,
												},
											],
											"footer": {
												"text"     : `YuYu1015 | ${formatTime(global_data.time_now)}`,
												"icon_url" : "https://github.com/whes1015.png",
											},
										},
									],
								}),
							})
								.catch(err => console.error(err));
						}
					}

					writeCsvData(
						eq.id,
						global_data.data.eew[index].serial,
						{
							time    : formatTime(global_data.time_now),
							author  : "trem",
							serial  : global_data.data.eew[index].serial,
							status  : global_data.data.eew[index].status,
							level   : global_data.data.eew[index].level,
							detail  : global_data.data.eew[index].detail,
							reason  : global_data.data.eew[index].reason,
							trigger : global_data.data.eew[index].trigger,
							lon     : global_data.data.eew[index].eq.lon,
							lat     : global_data.data.eew[index].eq.lat,
							depth   : global_data.data.eew[index].eq.depth,
							mag     : global_data.data.eew[index].eq.mag,
							loc     : global_data.data.eew[index].eq.loc,
							max     : global_data.data.eew[index].eq.max,
							acc     : global_data.data.eew[index].eq.acc.join(""),
							skip    : global_data.data.eew[index].eq.skip,
						},
						eq.eew?.station_data || [],
						eq.eew?.eew_search_data || [],
					);
				} else {
					let max_dist = 0;
					for (const id of Object.keys(global_data.station_info)) {
						const info = global_data.station_info[id].info.at(-1);
						if (!info.code) continue;
						const dist_surface = distance(global_data.data.eew[index].eq.lat, global_data.data.eew[index].eq.lon)(info.lat, info.lon);
						const dist = Math.sqrt(dist_surface ** 2 + global_data.data.eew[index].eq.depth ** 2);
						const pga = 1.657 * Math.pow(Math.E, (1.533 * global_data.data.eew[index].eq.mag)) * Math.pow(dist, -1.607);
						const _i = pga_to_float(pga);
						if (_i >= 0.5 && dist_surface > max_dist) max_dist = dist_surface;
					}

					const max_s_time = speed(global_data.data.eew[index].eq.depth, max_dist).Stime;

					if ((global_data.time_now > (global_data.data.eew[index].eq.time + max_s_time * 1000) || !global_data.data.eew[index].detail) && global_data.time_now - eq.send.check_time > 1000) {
						eq.send.check_count++;
						eq.send.check_time = global_data.time_now;
					}

					if ((!global_data.data.eew[index].detail && eq.send.check_count >= 10) || (global_data.data.eew[index].detail && (eq.send.check_count > 14 || (eq.group.length > 10 && eq.send.check_count > 4))))
						if (!global_data.data.eew[index].final) {
							eq.eew.level = 2;
							eq.eew.final = 1;

							global_data.data.eew[index].eq.acc[4] = "9";

							if (global_data.data.eew[index].eq.loc.endsWith("海")) {
								global_data.data.eew[index].eq.acc[0] = "9";
								global_data.data.eew[index].eq.acc[1] = "9";
							}

							global_data.data.eew[index].level = 2;
							global_data.data.eew[index].final = 1;
							global_data.data.eew[index].reason = 4;
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
									acc     : (!global_data.data.eew[index].eq.mag) ? "/////" : global_data.data.eew[index].eq.acc.join(""),
									eq      : {
										time  : global_data.data.eew[index].eq.time,
										lon   : global_data.data.eew[index].eq.lon,
										lat   : global_data.data.eew[index].eq.lat,
										depth : global_data.data.eew[index].eq.depth,
										mag   : global_data.data.eew[index].eq.mag,
										loc   : global_data.data.eew[index].eq.loc,
										max   : global_data.data.eew[index].eq.max,
										area  : global_data.data.eew[index].eq.area,
									},
								},
								time: global_data.time_now,
							});

							writeCsvData(
								eq.id,
								global_data.data.eew[index].serial,
								{
									time    : formatTime(global_data.time_now),
									author  : "trem",
									serial  : global_data.data.eew[index].serial,
									status  : global_data.data.eew[index].status,
									level   : global_data.data.eew[index].level,
									detail  : global_data.data.eew[index].detail,
									reason  : global_data.data.eew[index].reason,
									trigger : global_data.data.eew[index].trigger,
									lon     : global_data.data.eew[index].eq.lon,
									lat     : global_data.data.eew[index].eq.lat,
									depth   : global_data.data.eew[index].eq.depth,
									mag     : global_data.data.eew[index].eq.mag,
									loc     : global_data.data.eew[index].eq.loc,
									max     : global_data.data.eew[index].eq.max,
									acc     : global_data.data.eew[index].eq.acc.join(""),
									skip    : global_data.data.eew[index].eq.skip,
								},
								eq.eew?.station_data || [],
								eq.eew?.eew_search_data || [],
							);
						}
				}
			} else {
				logger.warn(`start eew => ${eq.id}`);

				const _loc = global_data.loc_search(eq.eew.lon, eq.eew.lat);

				if (_loc.endsWith("海")) {
					eq.eew.acc[0] = "9";
					eq.eew.acc[1] = "9";
				}

				global_data.data.eew.push({
					type    : "eew",
					author  : "trem",
					id      : eq.id,
					serial  : 0,
					status  : eq.eew.status,
					level   : eq.eew.level,
					detail  : eq.eew.detail,
					final   : 0,
					reason  : 0,
					trigger : eq.group.length,
					rts     : false,
					acc     : eq.eew.acc.join(""),
					eq      : {
						time  : eq.eew.time,
						lon   : eq.eew.lon,
						lat   : eq.eew.lat,
						depth : eq.eew.depth,
						mag   : eq.eew.mag,
						loc   : _loc,
						max   : eq.eew.max,
						area  : invertObjectAndGroupKeys(eq.eew.area),
					},
				});

				writeCsvData(
					eq.id,
					0,
					{
						time    : formatTime(global_data.time_now),
						author  : "trem",
						serial  : 0,
						status  : eq.eew.status,
						level   : eq.eew.level,
						detail  : eq.eew.detail,
						reason  : 0,
						trigger : eq.group.length,
						lon     : eq.eew.lon,
						lat     : eq.eew.lat,
						depth   : eq.eew.depth,
						mag     : eq.eew.mag,
						loc     : global_data.loc_search(eq.eew.lon, eq.eew.lat),
						max     : eq.eew.max,
						acc     : eq.eew.acc.join(""),
						skip    : eq.eew.skip,
					},
					eq.eew?.station_data || [],
				);
			}
		}
	}, 0);

	if (config.side == "SERVER")
		setInterval(() => {
			if (!global_data.eq_report_list.length) return;

			const msg = global_data.eq_report_list[0];

			fetch(config.TREM_REPORT_WEBHOOK, {
				method  : "POST",
				headers : { "Content-Type": "application/json" },
				body    : JSON.stringify(msg.dc),
			})
				.then(data => global_data.eq_report_list.splice(0, 1))
				.catch(error => void 0);
		}, 5000);
};

function findMaxKey(list) {
	let maxValue = 0;
	for (const key in list)
		if (Number(key) > maxValue) maxValue = Number(key);
	return maxValue;
}

function invertObjectAndGroupKeys(obj) {
	const inverted = {};
	for (const key in obj) {
		const value = obj[key];
		if (!inverted[value]) inverted[value] = [];
		inverted[value].push(key);
	}
	return inverted;
}

function areObjectsEqual(obj1, obj2) {
	const keys1 = Object.keys(obj1);
	const keys2 = Object.keys(obj2);
	if (keys1.length != keys2.length) return false;
	for (const key of keys1)
		if (obj1[key] != obj2[key]) return false;
	return true;
}

function updateGroups(existingGroups, newGroups) {
	const groupMap = new Map(existingGroups.map(group => [group.id, group]));

	newGroups.forEach(newGroup => {
		if (newGroup.id)
			if (groupMap.has(newGroup.id)) {
				const existingGroup = groupMap.get(newGroup.id);
				groupMap.set(newGroup.id, { ...existingGroup, ...newGroup });
			} else
				groupMap.set(newGroup.id, newGroup);
	});

	return Array.from(groupMap.values());
}

function mergeIntensityReports(report1, report2) {
	const mergedReport = {};

	const allIntensities = new Set([
		...Object.keys(report1),
		...Object.keys(report2),
	].map(Number));

	for (const intensity of allIntensities) {
		const list1 = report1[intensity] || [];
		const list2 = report2[intensity] || [];

		const shouldSkip = (code) => {
			for (let i = intensity + 1; i <= Math.max(...allIntensities); i++) {
				const higherList1 = report1[i] || [];
				const higherList2 = report2[i] || [];
				if (higherList1.includes(code) || higherList2.includes(code))
					return true;

			}
			return false;
		};

		const mergedList = [...new Set([...list1, ...list2])]
			.filter(code => !shouldSkip(code));

		if (mergedList.length > 0)
			mergedReport[intensity] = mergedList;

	}

	return mergedReport;
}

function intensity_report(global_data, list, station_info) {
	const d3_data_list = [];
	for (const station of list) {
		if (!station_info[station.id]) continue;
		const info = station_info[station.id].info[station_info[station.id].info.length - 1];
		d3_data_list.push({
			id  : station.id,
			lat : info.lat,
			lon : info.lon,
			pga : station.i,
		});
	}

	const intensity_list = {};
	for (const city of Object.keys(global_data.region))
		for (const town of Object.keys(global_data.region[city])) {
			const loc = global_data.region[city][town];
			const ans = search(d3_data_list, loc.lon, loc.lat);
			const ans_info = station_info[ans.closest].info[station_info[ans.closest].info.length - 1];
			const Dis = distance(loc.lat, loc.lon)(ans_info.lat, ans_info.lon);
			if (Dis > 15) continue;
			const int = intensity_float_to_int(ans.pga);
			if (int) {
				if (!intensity_list[int]) intensity_list[int] = [];
				intensity_list[int].push(loc.code);
			}
		}

	return intensity_list;
}

function search(data, lon, lat) {
	const Data = data.map(d => [d3.geoDistance([lon, lat], [d.lon, d.lat]), d.pga]).sort((a, b) => a[0] - b[0]);
	const Func = d3.interpolate(Data.map(d => d[1]), d3.extent(Data, d => d[0]));
	const closest = data.sort((a, b) => d3.geoDistance([lon, lat], [a.lon, a.lat]) - d3.geoDistance([lon, lat], [b.lon, b.lat]))[0];
	const Station = d3.geoDistance([lon, lat], [closest.lon, closest.lat]);
	const intensity = Func(Station);
	return {
		pga     : intensity[0],
		closest : closest.id,
	};
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
		logger.error("10" + err);
	} finally {
		if (conn) conn.release();
	}
}

function intensity_dc(data) {
	if (config.side == "LOCAL") return;
	dc([
		{
			"title"       : `震度速報 第${data.data.serial}報${(data.data.final) ? "(最終報)" : ""}`,
			"description" : `**${formatTime_intensity(data.data.id)}** 左右,\n觀測到 **最大震度${intensity_int_to_string(data.data.max).replace("級", "")}** 的晃動,\n**請注意今後的資訊**。\n(僅供參考 以 中央氣象署 發布之內容為準)\n[ExpTech Studio](https://exptech.com.tw/dc)\n[下載圖片](https://api-1.exptech.dev/file/images/intensity/${data.data.id}-${data.data.serial}.jpg)`,
			"color"       : int_to_color(data.data.max),
			"thumbnail"   : {
				"url": `https://raw.githack.com/ExpTechTW/API/master/resource/int/${data.data.max}.png`,
			},
			"image": {
				"url": `https://api-1.exptech.dev/file/images/intensity/${data.data.id}-${data.data.serial}.jpg`,
			},
			"footer": {
				"text"     : "ExpTech Studio 2023",
				"icon_url" : "https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/ExpTech.jpg",
			},
			"timestamp": new Date(),
		},
	]);

	if (config.LOCATION == "臺南") {
		tweetWithMedia(`[震度速報 第${data.data.serial}報${(data.data.final) ? "(最終報)" : ""}]\n${formatTime_intensity(data.data.id)} 左右,\n觀測到 最大震度${intensity_int_to_string(data.data.max).replace("級", "")} 的晃動,\n請注意今後的資訊。\n(僅供參考以 中央氣象署 發布之內容為準)\nExpTech Studio Ltd.\nhttps://exptech.com.tw/dc`, `https://api-1.exptech.dev/file/images/intensity/${data.data.id}-${data.data.serial}.jpg`);

		threadsAPI.publish({
			text       : `[震度速報 第${data.data.serial}報${(data.data.final) ? "(最終報)" : ""}]\n${formatTime_intensity(data.data.id)} 左右,\n觀測到 最大震度${intensity_int_to_string(data.data.max).replace("級", "")} 的晃動,\n請注意今後的資訊。\n(僅供參考以 中央氣象署 發布之內容為準)\nExpTech Studio Ltd.\n手機版 -> https://exptech.com.tw/dpip`,
			attachment : {
				image:
				`https://api-1.exptech.dev/file/images/intensity/${data.data.id}-${data.data.serial}.jpg`,
			},
		}).catch(err => console.log(err));
	}
}

function dc(embed, url = process.env.INTENSITY_REPORT_WEBHOOK) {
	webhook(url, {
		"username"   : "ExpTech Studio",
		"avatar_url" : "https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/ExpTech.jpg",
		"embeds"     : embed,
	});
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

function int_to_color(int) {
	const list = [2105376, 12900, 25800, 2004530, 16762880, 16750080, 16737280, 16711680, 12582912, 9830600];
	return list[int];
}

function formatTime_intensity(timestamp) {
	const date = new Date(timestamp);
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");
	const hours = date.getHours().toString().padStart(2, "0");
	const minutes = date.getMinutes().toString().padStart(2, "0");

	return `${year}/${month}/${day} ${hours}:${minutes}`;
}

async function downloadImage(imageUrl) {
	const response = await fetch(imageUrl);
	if (!response.ok) throw new Error(`image download error: ${response.statusText}`);
	return response.arrayBuffer();
}

async function tweetWithMedia(text, imageUrl) {
	try {
		const imageBuffer = await downloadImage(imageUrl);
		const mediaId = await rwClient.v1.uploadMedia(Buffer.from(imageBuffer), { mimeType: "image/jpeg" });
		await rwClient.v2.tweet(text, {
			media: { media_ids: [mediaId] },
		});
	} catch (err) {
		console.log("twitter error:", err);
	}
}

function findClosestIds(station_info, lat, lon, ids) {
	const dist = ids
		.map(id => {
			const station = station_info[id];
			if (!station) return { id, dis: Infinity };
			const stationLat = station.info.at(-1).lat;
			const stationLon = station.info.at(-1).lon;
			const dis = distance(lat, lon)(stationLat, stationLon);
			return { id, dis };
		})
		.sort((a, b) => a.dis - b.dis);
	return dist.slice(0, 25).map(d => d.id);
}