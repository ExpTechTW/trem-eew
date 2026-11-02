const fs = require("fs");

let travelTimeTable = null;
try {
	const data = fs.readFileSync("resource/time.json", "utf8");
	travelTimeTable = JSON.parse(data);
} catch (err) {
	console.error("Failed to load travel time table:", err);
}

function parseJSON(jsonString) {
	try {
		return JSON.parse(jsonString);
	} catch (err) {
		return null;
	}
}

function distance(latA, lngA) {
	return function(latB, lngB) {
		latA = latA * Math.PI / 180;
		lngA = lngA * Math.PI / 180;
		latB = latB * Math.PI / 180;
		lngB = lngB * Math.PI / 180;
		const sin_latA = Math.sin(Math.atan(Math.tan(latA)));
		const sin_latB = Math.sin(Math.atan(Math.tan(latB)));
		const cos_latA = Math.cos(Math.atan(Math.tan(latA)));
		const cos_latB = Math.cos(Math.atan(Math.tan(latB)));
		return Math.acos(sin_latA * sin_latB + cos_latA * cos_latB * Math.cos(lngA - lngB)) * 6371.008;
	};
}

function formatTime(timestamp) {
	const date = new Date(timestamp);
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");
	const hours = date.getHours().toString().padStart(2, "0");
	const minutes = date.getMinutes().toString().padStart(2, "0");
	const seconds = date.getSeconds().toString().padStart(2, "0");

	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function intensity_float_to_int(float) {
	return (float < 0) ? 0 : (float < 4.5) ? Math.round(float) : (float < 5) ? 5 : (float < 5.5) ? 6 : (float < 6) ? 7 : (float < 6.5) ? 8 : 9;
}

function pga_to_float(pga) {
	return 2 * Math.log10(pga) + 0.7;
}

function pga_to_intensity(pga) {
	return intensity_float_to_int(pga_to_float(pga));
}

function eew_location_intensity(region, lat, lon, depth, mag) {
	const json = {};
	for (const city of Object.keys(region))
		for (const town of Object.keys(region[city])) {
			const info = region[city][town];
			const dist_surface = distance(lat, lon)(info.lat, info.lon);
			const dist = Math.sqrt(dist_surface ** 2 + depth ** 2);
			const pga = 1.657 * Math.pow(Math.E, (1.533 * mag)) * Math.pow(dist, -1.607);
			let i = pga_to_float(pga);
			if (i >= 4.5) i = eew_i([lat, lon], [info.lat, info.lon], depth, mag);
			json[info.code] = intensity_float_to_int(i);
		}
	return json;
}

function eew_i(epicenterLocaltion, pointLocaltion, depth, magW) {
	const long = 10 ** (0.5 * magW - 1.85) / 2;
	const epicenterDistance = distance(epicenterLocaltion[0], epicenterLocaltion[1])(pointLocaltion[0], pointLocaltion[1]);
	const hypocenterDistance = (depth ** 2 + epicenterDistance ** 2) ** 0.5 - long;
	const x = Math.max(hypocenterDistance, 3);
	const gpv600 = 10 ** (
		0.58 * magW +
      0.0038 * depth - 1.29 -
      Math.log10(x + 0.0028 * (10 ** (0.5 * magW))) -
      0.002 * x
	);
	const arv = 1.0;
	const pgv400 = gpv600 * 1.31;
	const pgv = pgv400 * arv;
	return 2.68 + 1.72 * Math.log10(pgv);
}

function findClosestDepth(targetDepth) {
	const depths = Object.keys(travelTimeTable).map(d => parseInt(d));
	let closest = depths[0];
	let minDiff = Math.abs(targetDepth - closest);

	for (const depth of depths) {
		const diff = Math.abs(targetDepth - depth);
		if (diff < minDiff) {
			minDiff = diff;
			closest = depth;
		}
	}

	return closest.toString();
}

function findClosestDistance(depthData, targetDistance) {
	let closest = depthData[0];
	let minDiff = Math.abs(targetDistance - closest.R);

	for (const entry of depthData) {
		const diff = Math.abs(targetDistance - entry.R);
		if (diff < minDiff) {
			minDiff = diff;
			closest = entry;
		}
	}

	return closest;
}

function speed(depth, dist) {
	const depthKey = findClosestDepth(depth);
	const depthData = travelTimeTable[depthKey];

	if (!depthData) return { Ptime: 0, Stime: 0 };

	const entry = findClosestDistance(depthData, dist);

	return {
		Ptime : entry.P,
		Stime : entry.S,
	};
}

function findClosestIds(global_data, id) {
	const target = global_data.station_info[id];
	const targetLat = target.info[target.info.length - 1].lat;
	const targetLon = target.info[target.info.length - 1].lon;
	const distances = [];
	for (const [key, value] of Object.entries(global_data.station_info)) {
		const data = value.info.at(-1);
		if (key != id && global_data.time_now - global_data.last_data_time[key] < 3000 && !global_data.freeze_station[key] && data.code) {
			const lat = data.lat;
			const lon = data.lon;
			const dis = distance(targetLat, targetLon)(lat, lon);
			distances.push({ id: key, dis });
		}
	}
	distances.sort((a, b) => a.dis - b.dis);
	return distances.map(d => d.id);
}

function emoji_str(level) {
	let emoji = "";
	if (level == 0) emoji = "<:intensity0:1049183712761348156>";
	else if (level == 1) emoji = "<:intensity1:993950205126914178>";
	else if (level == 2) emoji = "<:intensity2:993950810750853191>";
	else if (level == 3) emoji = "<:intensity3:993950833110679623>";
	else if (level == 4) emoji = "<:intensity4:993950854078005288>";
	else if (level == 5) emoji = "<:intensity5w:993950875234091098>";
	else if (level == 6) emoji = "<:intensity5s:993950895643570247>";
	else if (level == 7) emoji = "<:intensity6w:993950915625226301>";
	else if (level == 8) emoji = "<:intensity6s:993950935493652601>";
	else if (level == 9) emoji = "<:intensity7:993950986316034100>";
	return emoji;
}

function intensity_int_to_string(int) {
	return (int == 5) ? "5弱" : (int == 6) ? "5強" : (int == 7) ? "6弱" : (int == 8) ? "6強" : (int == 9) ? "7級" : `${int}級`;
}

function formatTimestamp(Timestamp) {
	const date = new Date(Timestamp);
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	return `${hours}:${minutes}`;
}

module.exports = {
	parseJSON,
	formatTime,
	intensity_float_to_int,
	distance,
	pga_to_intensity,
	pga_to_float,
	speed,
	findClosestIds,
	emoji_str,
	intensity_int_to_string,
	formatTimestamp,
	eew_location_intensity,
};