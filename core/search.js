const calculateWeightedResidualSquared = require("../utils/calculateResidualSquared");
const { distance, pga_to_intensity, pga_to_float, intensity_float_to_int, speed } = require("../utils/utils");

process.on("message", (data) => {
	const { global_data, eq } = data;

	const region = global_data.region;

	let area = nsspe(region, global_data.station_info, eq.group, eq.eew.area);

	area = nsspe_pgv(region, global_data.station_info, eq.group, area);

	let max = 0;
	max = Math.max(max, ...Object.values(area));

	let lat = eq.search.lat;
	let lon = eq.search.lon;
	let depth = eq.search.depth;
	let mag = eq.search.mag;
	let time = eq.search.time;
	let detail = 0;
	let level = 0;
	const acc = ["1", "1", "1", "1", "1"];
	let eew_search_data = [];

	if (mag == 1 && eq.group.length > 2) {
		let count = 0;
		let amount_lat = 0;
		let amount_lon = 0;
		for (const station of eq.group) {
			if (!global_data.station_info[station.id]) continue;
			const info = global_data.station_info[station.id].info.at(-1);
			amount_lat += info.lat;
			amount_lon += info.lon;
			count++;
			if (count >= 3) break;
		}
		lat = Number((amount_lat / 3).toFixed(2));
		lon = Number((amount_lon / 3).toFixed(2));
	}

	if (eq.eew.serial && eq.group.length > 2) {
		if (!eq.eew_lock) {
			detail = 1;
			if (!level) level = 1;

			const latVariations = [0, -0.1, 0.1];
			const lonVariations = [0, -0.1, 0.1];

			const eew_list = [];

			for (const latVar of latVariations)
				for (const lonVar of lonVariations) {
					const _lat = lat + latVar;
					const _lon = lon + lonVar;
					const _eew = eew(global_data.station_info, eq, _lat, _lon, depth, global_data);

					eew_list.push({
						lat   : _lat,
						lon   : _lon,
						count : _eew.count,
						time  : _eew.eq_time,
					});
				}

			const element = findMinCount(eew_list);

			eew_search_data = eew_search_data.concat(eew_list);

			lat = Number(element.lat.toFixed(2));
			lon = Number(element.lon.toFixed(2));

			const _depthVariations = [0, -10, 10];

			const _eew_list_ = [];

			for (const latVar of latVariations)
				for (const lonVar of lonVariations)
					for (const depthVar of _depthVariations) {
						const _lat = lat + latVar;
						const _lon = lon + lonVar;
						let _depth = depth + depthVar;
						if (_depth < 10) _depth = 10;
						if (_depth > 150) _depth = 150;
						const _eew = eew(global_data.station_info, eq, _lat, _lon, _depth, global_data);

						_eew_list_.push({
							lat   : _lat,
							lon   : _lon,
							depth : _depth,
							count : _eew.count,
							time  : _eew.eq_time,
						});
					}

			const _element_ = findMinCount(_eew_list_);

			eew_search_data = eew_search_data.concat(_eew_list_);

			lat = Number(_element_.lat.toFixed(2));
			lon = Number(_element_.lon.toFixed(2));
			depth = _element_.depth;
			time = _element_.time;

			const __latVariations = [0, -0.02, 0.02];
			const __lonVariations = [0, -0.02, 0.02];
			const __depthVariations = [0, -2, 2];

			const __eew_list = [];

			for (const latVar of __latVariations)
				for (const lonVar of __lonVariations)
					for (const depthVar of __depthVariations) {
						const _lat = lat + latVar;
						const _lon = lon + lonVar;
						let _depth = depth + depthVar;
						if (_depth < 10) _depth = 10;
						if (_depth > 150) _depth = 150;
						const _eew = eew(global_data.station_info, eq, _lat, _lon, _depth, global_data);

						__eew_list.push({
							lat   : _lat,
							lon   : _lon,
							depth : _depth,
							count : _eew.count,
							time  : _eew.eq_time,
						});
					}

			const __element = findMinCount(__eew_list);

			lat = Number(__element.lat.toFixed(2));
			lon = Number(__element.lon.toFixed(2));
			depth = __element.depth;
			time = __element.time;

			eew_search_data = eew_search_data.concat(__eew_list);

			// Store eew search data for CSV export

			if (eq.group.length > 2) {
				acc[0] = "3";
				acc[1] = "3";
			}

			if (eq.group.length > 3) {
				acc[0] = "4";
				acc[1] = "4";
			}

			if (eq.group.length > 4) {
				acc[0] = "5";
				acc[1] = "5";
			}

			if (eq.group.length > 10) {
				acc[0] = "6";
				acc[1] = "6";
			}

			if (eq.group.length > 25) {
				acc[0] = "7";
				acc[1] = "7";
			}

			eq.group.sort((a, b) => a.first_time - b.first_time);
			const raw_list = eq.group.map(item => item.id);

			const stationInfo = global_data.station_info[eq.group[0].id];
			const stationLoc = stationInfo.info.at(-1);
			const search_list = findClosestIds(global_data.station_info, stationLoc.lat, stationLoc.lon, raw_list);

			let mag_count = 0;
			let mag_sum = 0;
			for (const station of eq.group) {
				if (!search_list.includes(station.id)) continue;
				const z_max = Math.abs(station.a_z);
				if (station.net == "SE-Net" && z_max < 1.55) continue;
				const info = global_data.station_info[station.id].info.at(-1);
				if (!info) continue;
				const dis = Math.sqrt(depth ** 2 + (distance(info.lat, info.lon)(lat, lon)) ** 2);
				const scale = -0.65 + 1.457 * Math.log10(z_max) + 3.026 * Math.log10(dis);
				mag_sum += scale;
				mag_count++;
			}

			acc[2] = "2";

			if (mag_count > 2) acc[3] = "3";
			if (mag_count > 3) acc[3] = "4";
			if (mag_count > 4) acc[3] = "5";
			if (mag_count > 10) acc[3] = "6";
			if (mag_count > 25) acc[3] = "7";

			mag = Number((mag_sum / mag_count).toFixed(1));
		}

		if (detail) {
			const p_time = ((global_data.time_now - time) / 1000 * 7) ** 2;
			const p_depth = depth ** 2;
			if (p_time < p_depth) {
				lat = eq.eew.lat;
				lon = eq.eew.lon;
				depth = eq.eew.depth;
				mag = eq.eew.mag;
				time = eq.eew.time;
				detail = 0;
			}
		}
	}

	let skip = 0;
	const squared_errors = [];

	if (detail) {
		const search_list = findClosestIds(global_data.station_info, lat, lon, Object.keys(global_data.station_info));

		const stationObj = {};
		for (const s of eq.group)
			stationObj[s.id] = s.pga;

		for (const station of search_list) {
			const info = global_data.station_info[station].info.at(-1);
			const dist_surface = distance(lat, lon)(info.lat, info.lon);
			const tr = speed(depth, dist_surface);
			const dist = Math.sqrt(dist_surface ** 2 + depth ** 2);
			const e_pga = 1.657 * Math.exp(1.533 * mag) * Math.pow(dist, -1.607);

			const r_pga = stationObj[station] || 0;

			if (global_data.time_now > time + tr.Stime * 1000) {
				// S波RMS計算：實際值與預期值的誤差平方
				const error = Math.abs(r_pga - e_pga);
				squared_errors.push(error * error);
			} else if (global_data.station_info[station].net === "MS-Net" &&
                   global_data.time_now > time + tr.Ptime * 1000 && e_pga > 0.5)
				// P波RMS計算：對於應該觸發但未觸發的測站
				if (r_pga === 0) {
					const error = e_pga;
					// 預期有值但實際為0
					squared_errors.push(error * error);
				}

		}

		// 計算RMS（使用IQR方法去除極值）
		if (squared_errors.length > 0) {
			// 先開平方根得到誤差值
			const errors = squared_errors.map(sq => Math.sqrt(sq));
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
			skip = Math.sqrt(mean_squared_error);
		} else
			skip = 0;

	} else
		skip = 10;


	if (skip < 40) acc[4] = "2";
	if (skip < 30) acc[4] = "3";
	if (skip < 20) acc[4] = "4";

	let station_data = [];
	if (detail && eq.eew.serial !== undefined) {
		const _eew = eew(global_data.station_info, eq, lat, lon, depth, global_data);
		station_data = _eew.station_data || [];
	}

	process.send({ eq, area, max, lat, lon, depth, mag, time, detail, level, skip, acc, station_data, eew_search_data });
});

function eew(station_info, eq, lat, lon, depth, global_data) {
	const list = eq.group;
	list.sort((a, b) => a.first_time - b.first_time);

	const raw_list = list.map(item => item.id);
	const stationInfo = station_info[list[0].id];
	if (!stationInfo) return { count: Infinity, eq_time: 0 };
	const stationLoc = stationInfo.info.at(-1);
	const search_list = findClosestIds(station_info, stationLoc.lat, stationLoc.lon, raw_list);

	let eq_all = 0;
	let amount = 0;
	let first_dist = 0;
	const station_list = {};

	for (const station of list) {
		if (!station_info[station.id] || !search_list.includes(station.id)) continue;

		const info = station_info[station.id].info.at(-1);
		const Dis = distance(info.lat, info.lon)(lat, lon);
		const tr = speed(depth, Dis);

		let eq_t = 0;
		if (station.pick_p) {
			eq_t = station.first_time - tr.Ptime * 1000;
			if (station.first_time !== station.max_time) {
				eq_t += station.max_time - tr.Stime * 1000;
				eq_t /= 2;
			}
		} else if (station.a_z > 35)
			continue;
		else
			eq_t = station.max_time - tr.Stime * 1000;

		eq_all += eq_t;
		amount++;

		let w = 1;
		if (!first_dist)
			first_dist = Dis;
		else
			if (Dis > 50)
				w = first_dist / Dis;

		station_list[station.id] = {
			eq_t,
			w,
		};
	}

	const eq_times = Object.values(station_list).map(station => station.eq_t);
	eq_times.sort((a, b) => a - b);

	let eq_time = 0;
	if (eq_times.length > 0)
		if (eq_times.length <= 4) {
			const sum = eq_times.reduce((acc, t) => acc + t, 0);
			eq_time = sum / eq_times.length;
		} else {
			const q1_index = Math.floor(eq_times.length * 0.25);
			const q3_index = Math.ceil(eq_times.length * 0.75);
			const iqr_times = eq_times.slice(q1_index, q3_index);
			const sum = iqr_times.reduce((acc, t) => acc + t, 0);
			eq_time = sum / iqr_times.length;
		}

	const observedTimes = [];
	const theoreticalTimes = [];
	const weights = [];

	for (const stationId of Object.keys(station_list)) {
		observedTimes.push(station_list[stationId].eq_t);
		theoreticalTimes.push(0);
		weights.push(station_list[stationId].w);
	}

	let count = calculateWeightedResidualSquared(
		observedTimes,
		eq_time,
		theoreticalTimes,
		0,
		weights,
	);

	if (
		(global_data.time_now - eq.id < 5000) ||
	((global_data.time_now - eq.id < 10000) && eq.group.length < 10)
	)
		for (const id of Object.keys(global_data.rts)) {
			if (!station_info[id]) continue;
			if (global_data.rts[id].alert) continue;

			const info = station_info[id].info.at(-1);
			const Dis = distance(lat, lon)(info.lat, info.lon);
			if (Dis < 30) {
				let tr = speed(depth, Dis);
				tr = tr.Stime * 1000;
				const arr_t = eq_time + tr;
				if (global_data.time_now > arr_t)
					count++;
			}
		}

	// Collect detailed station data for CSV export
	const station_data = [];
	for (const station of list) {
		if (!station_info[station.id] || !search_list.includes(station.id)) continue;

		const info = station_info[station.id].info.at(-1);
		const Dis = distance(info.lat, info.lon)(lat, lon);
		const tr = speed(depth, Dis);

		station_data.push({
			id         : station.id,
			net        : station_info[station.id].net,
			lat        : info.lat,
			lon        : info.lon,
			first_time : station.first_time,
			max_time   : station.max_time,
			pick_p     : station.pick_p || false,
			a_z        : station.a_z,
			pga        : station.pga,
			pgv        : station.pgv || 0,
			eq_t       : station_list[station.id]?.eq_t || 0,
			weight     : station_list[station.id]?.w || 0,
			distance   : Dis,
			p_time     : tr.Ptime,
			s_time     : tr.Stime,
		});
	}

	return { count, eq_time: Math.round(eq_time), station_data };
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

function nsspe(region, station_info, list, area) {
	for (const station of list) {
		const info = station_info[station.id].info.at(-1);
		for (const city of Object.keys(region))
			for (const town of Object.keys(region[city])) {
				const loc = region[city][town];
				const Dis = distance(loc.lat, loc.lon)(info.lat, info.lon);
				if (Dis > 35) continue;
				const pga = calculatePGAatB(station.pga * 1.2, Dis);
				const i = pga_to_intensity(pga);
				if (i)
					if (!area[loc.code] || i > area[loc.code]) area[loc.code] = i;
			}
	}
	return area;
}

function nsspe_pgv(region, station_info, list, area) {
	for (const station of list) {
		const info = station_info[station.id].info.at(-1);
		for (const city of Object.keys(region))
			for (const town of Object.keys(region[city])) {
				const loc = region[city][town];
				const Dis = distance(loc.lat, loc.lon)(info.lat, info.lon);
				if (Dis > 35) continue;
				const pgv = calculatePGAatB(station.pgv * 1.5, Dis);
				const _pgv = 2.14 * Math.log10(pgv) + 1.89;
				const i = intensity_float_to_int(_pgv);
				if (i)
					if (!area[loc.code] || i > area[loc.code]) area[loc.code] = i;
			}
	}
	return area;
}

function calculatePGAatB(pgaAtA, distAtoB) {
	const alpha = 0.5;
	const decayFactor = 1 / Math.pow(distAtoB, alpha);
	const pgaAtB = pgaAtA * decayFactor;
	return pgaAtB;
}

function findMinCount(eew_list) {
	if (eew_list.length === 0) return null;
	let minElement = eew_list[0];
	for (const element of eew_list)
		if (element.count < minElement.count) minElement = element;
	return minElement;
}