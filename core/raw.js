const { intensity_float_to_int, formatTime } = require("../utils/utils");

const { fft, ifft } = require("fft-js");

const sta_lta_data = {};

const trigger_level = {
	1480496  : 2.05,
	14818180 : 2.1,
	6392144  : 2.1,
};

const lastData_ACC = {};
const lastData_VEL = {};

const accumulatedVelocity = {};
const accumulatedVelocity_time = {};
const lastFilteredAcc = {};

const lastFilterOutput = {};
const timeInterval = 0.02;
const Fs = 1 / timeInterval;
const Fc = 10;
const alpha = 2 * Math.PI * Fc / (2 * Math.PI * Fc + Fs);
const skip = {};

const last_data_time = {};

const jma_data = {};

module.exports = (global_data, logger) => {
	global_data.events.on("data", (firstElement) => {
		const ID = firstElement.ID;

		global_data.last_data_time[ID] = global_data.time_now;

		if (global_data.time_now - (last_data_time[ID] ?? global_data.time_now) > 5000) delete sta_lta_data[ID];

		last_data_time[ID] = global_data.time_now;

		if (!sta_lta_data[ID]) sta_lta_data[ID] = [];

		sta_lta_data[ID].push({
			x : firstElement.X,
			y : firstElement.Y,
			z : firstElement.Z,
		});

		const sampleRate = (firstElement.Net == "SE-Net") ? 20 : 50;
		const maxDataLength = 45 * sampleRate;

		if (sta_lta_data[ID].length > maxDataLength) sta_lta_data[ID].shift();

		const staLength = sampleRate;
		const ltaLength = sta_lta_data[ID].length;

		let pga, pgv, a_x, a_y, a_z, v_x, v_y, v_z;
		if (firstElement.Net == "MS-Net") {
			v_x = firstElement.X;
			v_y = firstElement.Y;
			v_z = firstElement.Z;

			a_x = Number(differentiate(`${ID}-X`, lowPassFilter(`${ID}-X`, v_x)).toFixed(4));
			a_y = Number(differentiate(`${ID}-Y`, lowPassFilter(`${ID}-Y`, v_y)).toFixed(4));
			a_z = Number(differentiate(`${ID}-Z`, lowPassFilter(`${ID}-Z`, v_z)).toFixed(4));
		} else {
			a_x = firstElement.X;
			a_y = firstElement.Y;
			a_z = firstElement.Z;

			v_x = Number(integrate(global_data.time_now, `${ID}-X`, a_x).toFixed(2));
			v_y = Number(integrate(global_data.time_now, `${ID}-Y`, a_y).toFixed(2));
			v_z = Number(integrate(global_data.time_now, `${ID}-Z`, a_z).toFixed(2));
		}

		pga = Math.sqrt(a_x ** 2 + a_y ** 2 + a_z ** 2);
		pgv = Math.sqrt(v_x ** 2 + v_y ** 2 + v_z ** 2);

		if (!jma_data[ID]) jma_data[ID] = [];

		jma_data[ID].push({
			x : a_x,
			y : a_y,
			z : a_z,
		});

		if (jma_data[ID].length > sampleRate * 1.5) jma_data[ID].splice(0, 1);

		const jma_x = [];
		const jma_y = [];
		const jma_z = [];

		const down = (pga < 4 && firstElement.Net == "SE-Net" && !global_data.time_now - (global_data.rts[ID]?.time ?? 0) < 30000) ? true : false;
		for (const _jma of jma_data[ID]) {
			jma_x.push(_jma.x * ((down) ? 0.01 : 1));
			jma_y.push(_jma.y * ((down) ? 0.01 : 1));
			jma_z.push(_jma.z * ((down) ? 0.01 : 1));
		}

		// const c_pga = (pga < 4 && firstElement.Net == "SE-Net" && !global_data.time_now - (global_data.rts[ID]?.time ?? 0) < 30000) ? pga * 0.01 : pga;
		let I = -3;
		// I = 2 * Math.log10(c_pga) + 0.7;
		// I = Number(I.toFixed(1));
		// if (I > 1 && pga < 5 && firstElement.Net == "SE-Net") I = 1;
		// if (intensity_float_to_int(I) > 4) {
		// 	I = 2.14 * Math.log10(pgv) + 1.89;
		// 	I = Number(I.toFixed(1));
		// 	if (intensity_float_to_int(I) <= 4) I = 4.4;
		// }

		if (jma_x.length > sampleRate) I = Number(jma([[...jma_x], [...jma_y], [...jma_z]], sampleRate));
		if (!I || I < -3) I = -3;
		if (I > 1 && pga < 5 && firstElement.Net == "SE-Net") I = 1;

		pga = Number(pga.toFixed(2));
		pgv = Number(pgv.toFixed(2));

		if (global_data.time_now - (skip[ID] ?? 0) < 7500) {
			if (!global_data.rts[ID])
				global_data.rts[ID] = {
					pga,
					pgv,
					freeze        : (global_data.freeze_station[ID]) ? true : false,
					i             : I,
					I,
					time          : 0,
					update_i_time : 0,
				};
			else {
				global_data.rts[ID].freeze = (global_data.freeze_station[ID]) ? true : false;
				global_data.rts[ID].pga = Number(((pga > global_data.rts[ID].pga) ? pga : global_data.rts[ID].pga * 99 / 100 + pga * 1 / 100).toFixed(2));
				global_data.rts[ID].pgv = Number(((pgv > global_data.rts[ID].pgv) ? pgv : global_data.rts[ID].pgv * 99 / 100 + pgv * 1 / 100).toFixed(2));
				global_data.rts[ID].i = I;
				if (I > global_data.rts[ID].I) {
					if (global_data.time_now - global_data.rts[ID].time < 30000) global_data.rts[ID].I = I;
				} else
					if (global_data.time_now - global_data.rts[ID].update_i_time > 500) {
						global_data.rts[ID].update_i_time = global_data.time_now;
						global_data.rts[ID].I = global_data.rts[ID].I * 998 / 1000 + I * 2 / 1000;
					}
			}

			if (global_data.freeze_station[ID])
				if (global_data.time_now > global_data.freeze_station[ID]) delete global_data.freeze_station[ID];

			const now = Date.now();
			if (global_data.freeze_list.includes(ID)) global_data.freeze_station[ID] = now + 90000;

			if (ltaLength >= staLength) {
				const staData = sta_lta_data[ID].slice(-staLength);

				const wave_ratio = calculatePositiveNegativeRatio(staData).ratio;

				if (wave_ratio < 2 || global_data.time_now - (skip[ID] ?? 0) < 7500) {
					const ltaData = sta_lta_data[ID];

					const staAverage = calculateAverage(staData);
					const ltaAverage = calculateAverage(ltaData);

					const staLtaRatio_x = staAverage.x / ltaAverage.x;
					const staLtaRatio_y = staAverage.y / ltaAverage.y;
					const staLtaRatio_z = staAverage.z / ltaAverage.z;

					let alert = false;
					let limit = (trigger_level[ID]) ? trigger_level[ID] : 2;
					if (firstElement.Net == "MS-Net") {
						limit = (trigger_level[ID]) ? trigger_level[ID] : 1.65;
						if (staLtaRatio_x > limit && staLtaRatio_y > limit) alert = true;
					} else
						if (staLtaRatio_x > limit || staLtaRatio_y > limit || staLtaRatio_z > limit) alert = true;

					if (alert && global_data.freeze_station[ID]) {
						alert = false;
						if (global_data.freeze_station[ID] - now < 60000) {
							global_data.freeze_station[ID] = now + 65000;
							logger.warn(`${formatTime(global_data.time_now)} freeze ${ID} + 60s`);
						}
					}

					if (alert) {
						const baselineCrossings = countBaselineCrossings(staData);
						if (baselineCrossings.x < 3 || baselineCrossings.y < 3 || baselineCrossings.z < 3) alert = false;
					}

					if (alert || global_data.time_now - global_data.rts[ID].time < 30000) {
						const index = global_data.station_alert_list.findIndex(item => item.id == ID);
						if (alert) global_data.rts[ID].time = global_data.time_now;
						if (index != -1) {
							if (alert) global_data.station_alert_list[index].last_time = global_data.time_now;

							if (global_data.station_alert_list[index].pga < pga) {
								global_data.station_alert_list[index].pga = pga;
								global_data.station_alert_list[index].max_time = global_data.time_now;
							}

							if (global_data.station_alert_list[index].pgv < pgv) global_data.station_alert_list[index].pgv = pgv;

							if (global_data.station_alert_list[index].i < I) global_data.station_alert_list[index].i = I;

							if (Math.abs(global_data.station_alert_list[index].a_x) < Math.abs(a_x)) global_data.station_alert_list[index].a_x = a_x;
							if (Math.abs(global_data.station_alert_list[index].a_y) < Math.abs(a_y)) global_data.station_alert_list[index].a_y = a_y;
							if (Math.abs(global_data.station_alert_list[index].a_z) < Math.abs(a_z)) global_data.station_alert_list[index].a_z = a_z;
							if (Math.abs(global_data.station_alert_list[index].v_x) < Math.abs(v_x)) global_data.station_alert_list[index].v_x = v_x;
							if (Math.abs(global_data.station_alert_list[index].v_y) < Math.abs(v_y)) global_data.station_alert_list[index].v_y = v_y;
							if (Math.abs(global_data.station_alert_list[index].v_z) < Math.abs(v_z)) global_data.station_alert_list[index].v_z = v_z;
						} else {
							logger.info(`${formatTime(global_data.time_now)} ${ID} ${staLtaRatio_x.toFixed(3)} ${staLtaRatio_y.toFixed(3)} ${staLtaRatio_z.toFixed(3)} ${pga} ${pgv} ${firstElement.Net}`);
							let pick_p = false;
							const ratio = (staLtaRatio_x + staLtaRatio_y) / 2;
							if (staLtaRatio_z > ratio) pick_p = true;
							global_data.station_alert_list.push({
								id         : ID,
								net        : firstElement.Net,
								first_time : global_data.time_now,
								last_time  : global_data.time_now,
								max_time   : global_data.time_now,
								pick_p,
								pga        : pga,
								pgv        : pgv,
								i          : I,
								a_x,
								a_y,
								a_z,
								v_x,
								v_y,
								v_z,
							});
						}
					}
				} else skip[ID] = global_data.time_now;
			}
		} else skip[ID] = global_data.time_now;
	});
};

function countBaselineCrossings(data) {
	const counts = { x: 0, y: 0, z: 0 };
	for (let i = 1; i < data.length; i++)
		["x", "y", "z"].forEach(axis => {
			if ((data[i - 1][axis] < 0 && data[i][axis] > 0) || (data[i - 1][axis] > 0 && data[i][axis] < 0))
				counts[axis]++;
		});
	return counts;
}

function lowPassFilter(id, currentData) {
	if (!lastFilterOutput[id]) {
		lastFilterOutput[id] = currentData;
		return currentData;
	}

	const filteredData = alpha * currentData + (1 - alpha) * lastFilterOutput[id];
	lastFilterOutput[id] = filteredData;
	return filteredData;
}

function integrate(time_now, id, currentData) {
	if (!lastData_ACC[id] || time_now - (accumulatedVelocity_time[id] ?? 0) > 1000) {
		lastData_ACC[id] = currentData;
		accumulatedVelocity[id] = 0;
		accumulatedVelocity_time[id] = time_now;
		return 0;
	} else {
		const velocityIncrease = (currentData + lastData_ACC[id]) / 2 * 0.05;
		accumulatedVelocity[id] += velocityIncrease;
		lastData_ACC[id] = currentData;
		return accumulatedVelocity[id];
	}
}

function differentiate(id, currentData) {
	if (!lastData_VEL[id]) {
		lastData_VEL[id] = currentData;
		lastFilteredAcc[id] = 0;
		return 0;
	} else {
		const acceleration = (currentData - lastData_VEL[id]) / 0.02;
		lastData_VEL[id] = currentData;
		return acceleration;
	}
}

function calculatePositiveNegativeRatio(data) {
	let positiveSum = 0;
	let negativeSum = 0;

	data.forEach(point => {
		function classifyAndSum(value) {
			if (value > 0) positiveSum += value;
			else negativeSum += Math.abs(value);
		}

		classifyAndSum(point.x);
		classifyAndSum(point.y);
		classifyAndSum(point.z);
	});

	const ratio = negativeSum === 0 ? null : positiveSum / negativeSum;

	return {
		positiveSum : positiveSum,
		negativeSum : negativeSum,
		ratio       : ratio,
	};
}

function calculateAverage(data) {
	const sum = { x: 0, y: 0, z: 0 };
	data.forEach(point => {
		sum.x += Math.abs(point.x);
		sum.y += Math.abs(point.y);
		sum.z += Math.abs(point.z);
	});
	return {
		x : sum.x / data.length,
		y : sum.y / data.length,
		z : sum.z / data.length,
	};
}

function arrayPadding(arr) {
	let dips = 2;
	while (dips <= arr.length) dips *= 2;
	return arr.concat(new Array(dips - arr.length).fill(0));
}

const filterFactorsCache = {};

function jma(data, rate) {
	const gals = data;
	const fftGals = gals.map(gal => fft(arrayPadding(gal)));
	const dt = 1 / rate;
	const NF = fftGals[0].length;
	const NF2 = NF / 2;

	if (!filterFactorsCache[NF]) {
		const factors = [];
		for (let i = 1; i <= NF2; i++) {
			const frq = i / (NF * dt);
			const x = frq / 10;
			const fc = Math.sqrt(1 / frq);
			const fh = 1 / Math.sqrt(
				1 +
        0.694 * Math.pow(x, 2) +
        0.241 * Math.pow(x, 4) +
        0.0557 * Math.pow(x, 6) +
        0.009664 * Math.pow(x, 8) +
        0.00134 * Math.pow(x, 10) +
        0.000155 * Math.pow(x, 12),
			);
			const fl = Math.sqrt(1 - Math.exp(-Math.pow(frq / 0.5, 3)));
			const fa = fc * fh * fl;
			factors[i] = fa;
		}
		filterFactorsCache[NF] = factors;
	}
	const factors = filterFactorsCache[NF];
	for (let i = 1; i <= NF2; i++) {
		const fa = factors[i];
		for (let lk = 0; lk < fftGals.length; lk++) {
			const fs = [fftGals[lk][i][0] * fa, fftGals[lk][i][1] * fa];
			fftGals[lk][i] = fs;
			fftGals[lk][NF - i] = [fs[0], -fs[1]];
		}
	}

	const filterGals = fftGals.map(fftGal => ifft(fftGal));
	const lenGals = [];
	filterGals.forEach((gal, i) => {
		gal.forEach(([gas], t) => {
			(lenGals[t] || (lenGals[t] = [])).push(gas);
		});
	});
	const syntheticGal = lenGals.map(([s1, s2, s3]) => Math.sqrt(s1 ** 2 + s2 ** 2 + s3 ** 2));
	syntheticGal.sort((a, b) => b - a);
	const top03 = Math.floor(0.3 / dt) - 1;
	const intVal = 2 * (Math.log(syntheticGal[top03]) / Math.LN10) + 0.94;
	const kInt = (Math.floor(Math.round(intVal * 100) / 10) / 10).toFixed(1);
	return kInt;
}