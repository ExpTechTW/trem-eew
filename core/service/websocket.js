const config = require("../../config");
const { emoji_str, formatTime, intensity_int_to_string, formatTimestamp } = require("../../utils/utils");

const mariadb = require("mariadb");

const pool = mariadb.createPool({
	host            : "mariadb",
	user            : "root",
	password        : process.env.DB_PASSWORD,
	database        : "exptech",
	connectionLimit : 5,
});

const WebSocket = require("ws");

const clients = new Map();

let ws_send_time = 0;

module.exports = (global_data, logger) => {
	const wss = new WebSocket.Server({ port: 30003 });
	logger.info("WebSocket 伺服器 已啟動");

	wss.on("connection", (ws) => {
		const id = generateUniqueId();
		clients.set(id, ws);

		ws.on("message", (msg) => {
			logger.info(`客戶端 ${id} 已連接`);
		});

		ws.on("close", () => {
			clients.delete(id);
			logger.info(`客户端 ${id} 已斷開連接`);
		});
	});

	setInterval(() => broadcast({ type: "ntp" }), 1000);

	if (config.side == "SERVER")
		setInterval(() => {
			if (global_data.time_now - ws_send_time < 500) return;
			broadcast({
				type    : "data",
				key     : process.env.WS_KEY,
				version : 1,
				data    : {
					type : "rts",
					data : global_data.data.rts,
				},
				time: global_data.time_now,
			});
			ws_send_time = global_data.time_now;
		}, 0);

	global_data.broadcast = broadcast;

	function broadcast(msg) {
		const message = JSON.stringify(msg);
		clients.forEach((_client) => {
			_client.send(message);
		});

		const data = msg.data;

		if (!msg.data || !data.type) return;

		if (data.type == "eew") {
			const emoji = emoji_str(data.eq.max);
			dc_eew([
				{
					"title"       : `⚠️ TREM EEW 第 ${data.serial} 報(${(data.status == 3) ? "取消" : (data.final == 1) ? "最終" : (!data.status) ? "注意" : "警報"}) | ${(!data.detail) ? "NSSPE" : "EEW"}`,
					"description" : "",
					"color"       : (!data.status) ? 16753920 : (data.status == 1) ? 16711680 : 12500670,
					"fields"      : [
						{
							"name"   : "預估最大震度",
							"value"  : emoji,
							"inline" : true,
						},
						{
							"name"   : "ID",
							"value"  : "`" + data.id + "`",
							"inline" : true,
						},
						{
							"name"   : "來源",
							"value"  : `TREM(${config.LOCATION})[${config.side}]`,
							"inline" : true,
						},
						{
							"name"   : "發震時間",
							"value"  : `${formatTime(data.eq.time)}(<t:${Math.round(data.eq.time / 1000)}:R>)`,
							"inline" : false,
						},
						{
							"name"   : "震央位置",
							"value"  : `${data.eq.loc} | ${data.eq.lat}°N ${data.eq.lon}°E`,
							"inline" : false,
						},
						{
							"name"   : "規模",
							"value"  : (!data.detail) ? "M1.0 (定值)" : `M${data.eq.mag}`,
							"inline" : true,
						},
						{
							"name"   : "深度",
							"value"  : (!data.detail) ? "10km (定值)" : `${data.eq.depth}km`,
							"inline" : true,
						},
						{
							"name"   : "狀態",
							"value"  : (!data.level) ? "保留地震(EQp)" : (data.level == 1) ? "持續地震(EQ)" : "收斂地震(EQc)",
							"inline" : true,
						},
						{
							"name"   : "精度",
							"value"  : `${(!data.detail) ? "低" : (data.trigger < 5) ? "中" : "高"}(${data.acc})`,
							"inline" : true,
						},
						{
							"name"   : "方法",
							"value"  : (!data.detail) ? "NSSPE" : "EEW",
							"inline" : true,
						},
						{
							"name"   : "Trigger",
							"value"  : data.trigger,
							"inline" : true,
						},
						{
							"name"   : "備註",
							"value"  : (data.status == 3) ? "因 誤報 或 地震干擾 釋出 取消報" : (!data.detail) ? "無法確定 `震源參數` 將視後續情況發布 `更正報` 或 `取消報`" : (data.trigger < 5) ? "當前釋出的 EEW 訊息 精度較低 請留意後續變化" : "臨震應變 [趴下、掩護、穩住]",
							"inline" : false,
						},
						{
							"name"   : "更正原因",
							"value"  : (data.reason == 1) ? "EEW 預測`震央` 發生變化" : (data.reason == 2) ? "EEW 預測`規模` 發生變化" : (data.reason == 3) ? "由於使用 `NSSPE` 方法進行的 `預測震度` 發生變化" : (data.reason == 4) ? "釋出 最終報" : (data.reason == 5) ? "釋出 取消報" : "",
							"inline" : false,
						},
					],
					"footer": {
						"text"     : `ExpTech Studio 2023 | ${formatTime(global_data.time_now)}`,
						"icon_url" : "https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/ExpTech.jpg",
					},
				},
			]);

			if (data.author == "trem") write(logger, {
				ID   : `${data.id}-${data.serial}`,
				Send : formatTime(msg.time),
				Eq   : formatTime(data.eq.time),
				Data : JSON.stringify({
					"author"  : data.author,
					"status"  : data.status,
					"final"   : data.final,
					"rts"     : data.rts,
					"detail"  : data.detail,
					"reason"  : data.reason,
					"trigger" : data.trigger,
					"acc"     : data.acc,
					"eq"      : {
						"lon"   : data.eq.lon,
						"lat"   : data.eq.lat,
						"depth" : data.eq.depth,
						"mag"   : data.eq.mag,
						"loc"   : data.eq.loc,
						"max"   : data.eq.max,
						"area"  : data.eq.area,
					},
				}),
			});
			else write(logger, {
				ID   : `${data.id}-${data.serial}`,
				Send : formatTime(msg.time),
				Eq   : formatTime(data.eq.time),
				Data : JSON.stringify({
					"author" : data.author,
					"status" : data.status,
					"final"  : data.final,
					"eq"     : {
						"lon"   : data.eq.lon,
						"lat"   : data.eq.lat,
						"depth" : data.eq.depth,
						"mag"   : data.eq.mag,
						"loc"   : data.eq.loc,
						"max"   : data.eq.max,
					},
				}),
			});
		} else if (data.type == "intensity") {
			const title = `震度速報 [${formatTimestamp(data.id)}]`;
			const info = intensity_area(global_data, data.area);
			const emoji = emoji_str(data.max);

			write_intensity(logger, {
				ID   : `${data.id}-${data.serial}`,
				Send : formatTime(msg.time),
				Data : JSON.stringify({
					alert : data.alert,
					final : data.final,
					area  : data.area,
					max   : data.max,
				}),
			});

			dc_intensity([
				{
					"title"       : `${title} | 第 ${data.serial} 報`,
					"description" : "",
					"color"       : (data.max < 4) ? 16753920 : 16711680,
					"fields"      : [
						{
							"name"   : "實測最大震度",
							"value"  : emoji,
							"inline" : true,
						},
						{
							"name"   : "ID",
							"value"  : "`" + data.id + "`",
							"inline" : true,
						},
						{
							"name"   : "來源",
							"value"  : `TREM(${config.LOCATION})[${config.side}]`,
							"inline" : true,
						},
						{
							"name"   : "各地震度",
							"value"  : info.str,
							"inline" : false,
						},
						{
							"name"   : "備註",
							"value"  : "此 資訊 為 TREM 系統 `自動觀測結果` 未經人為檢視確認 `僅供參考`",
							"inline" : false,
						},
						{
							"name"   : "網址",
							"value"  : "[TREM 強震監視器](https://exptech.com.tw/trem)",
							"inline" : false,
						},
					],
					"footer": {
						"text"     : `ExpTech Studio 2023 | ${formatTime(global_data.time_now)}`,
						"icon_url" : "https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/ExpTech.jpg",
					},
				},
			]);
		}
	}

	// function eew(data, time) {
	// 	global_data.broadcast({
	// 		type: "data",
	// 		key: process.env.WS_KEY,
	// 		version: 1,
	// 		data,
	// 		time,
	// 	});
	// }

	// setTimeout(() => {
	// 	eew({
	// 		type: "eew",
	// 		author: "trem",
	// 		detail: 0,
	// 		level: 0,
	// 		id: 12345,
	// 		serial: 1,
	// 		status: 0,
	// 		reason: 0,
	// 		final: 0,
	// 		trigger: 0,
	// 		rts: 1,
	// 		eq: {
	// 			time: Date.now() - 10000,
	// 			lon: 120.28,
	// 			lat: 22.69,
	// 			depth: 10,
	// 			mag: 1,
	// 			loc: "高雄市楠梓區",
	// 			max: 3,
	// 			area: {},
	// 		},
	// 	}, Date.now());
	// 	setTimeout(() => {
	// 		eew({
	// 			type: "eew",
	// 			author: "trem",
	// 			detail: 1,
	// 			level: 1,
	// 			id: 12345,
	// 			serial: 2,
	// 			status: 1,
	// 			reason: 0,
	// 			final: 0,
	// 			trigger: 0,
	// 			rts: 1,
	// 			eq: {
	// 				time: Date.now() - 12000,
	// 				lon: 120,
	// 				lat: 22,
	// 				depth: 20,
	// 				mag: 5.5,
	// 				loc: "高雄市南部外海",
	// 				max: 6,
	// 				area: {},
	// 			},
	// 		}, Date.now());
	// 		setTimeout(() => {
	// 			eew({
	// 				type: "eew",
	// 				author: "trem",
	// 				detail: 1,
	// 				level: 1,
	// 				id: 12345,
	// 				serial: 3,
	// 				status: 1,
	// 				reason: 0,
	// 				final: 0,
	// 				trigger: 0,
	// 				rts: 1,
	// 				eq: {
	// 					time: Date.now() - 12000,
	// 					lon: 120,
	// 					lat: 22,
	// 					depth: 20,
	// 					mag: 5.2,
	// 					loc: "高雄市南部外海",
	// 					max: 6,
	// 					area: {},
	// 				},
	// 			}, Date.now());
	// 			setTimeout(() => {
	// 				eew({
	// 					type: "eew",
	// 					author: "trem",
	// 					detail: 1,
	// 					level: 1,
	// 					id: 12345,
	// 					serial: 4,
	// 					status: 1,
	// 					reason: 0,
	// 					final: 0,
	// 					trigger: 0,
	// 					rts: 1,
	// 					eq: {
	// 						time: Date.now() - 12000,
	// 						lon: 120,
	// 						lat: 22,
	// 						depth: 20,
	// 						mag: 6.8,
	// 						loc: "高雄市南部外海",
	// 						max: 6,
	// 						area: {},
	// 					},
	// 				}, Date.now());
	// 				setTimeout(() => {
	// 					eew({
	// 						type: "eew",
	// 						author: "trem",
	// 						detail: 1,
	// 						level: 1,
	// 						id: 12345,
	// 						serial: 5,
	// 						status: 1,
	// 						reason: 0,
	// 						final: 0,
	// 						trigger: 0,
	// 						rts: 1,
	// 						eq: {
	// 							time: Date.now() - 12000,
	// 							lon: 120,
	// 							lat: 22,
	// 							depth: 20,
	// 							mag: 6.2,
	// 							loc: "高雄市南部外海",
	// 							max: 6,
	// 							area: {},
	// 						},
	// 					}, Date.now());
	// 					setTimeout(() => {
	// 						eew({
	// 							type: "eew",
	// 							author: "trem",
	// 							detail: 1,
	// 							level: 1,
	// 							id: 12345,
	// 							serial: 6,
	// 							status: 1,
	// 							reason: 0,
	// 							final: 0,
	// 							trigger: 0,
	// 							rts: 1,
	// 							eq: {
	// 								time: Date.now() - 12000,
	// 								lon: 120,
	// 								lat: 22,
	// 								depth: 20,
	// 								mag: 6.4,
	// 								loc: "高雄市南部外海",
	// 								max: 6,
	// 								area: {},
	// 							},
	// 						}, Date.now());
	// 						setTimeout(() => {
	// 							eew({
	// 								type: "eew",
	// 								author: "trem",
	// 								detail: 1,
	// 								level: 1,
	// 								id: 12345,
	// 								serial: 7,
	// 								status: 1,
	// 								reason: 0,
	// 								final: 0,
	// 								trigger: 0,
	// 								rts: 1,
	// 								eq: {
	// 									time: Date.now() - 12000,
	// 									lon: 120,
	// 									lat: 22,
	// 									depth: 20,
	// 									mag: 7,
	// 									loc: "高雄市南部外海",
	// 									max: 6,
	// 									area: {},
	// 								},
	// 							}, Date.now());
	// 							setTimeout(() => {
	// 								eew({
	// 									type: "eew",
	// 									author: "trem",
	// 									detail: 1,
	// 									level: 1,
	// 									id: 12345,
	// 									serial: 8,
	// 									status: 1,
	// 									reason: 0,
	// 									final: 0,
	// 									trigger: 0,
	// 									rts: 1,
	// 									eq: {
	// 										time: Date.now() - 12000,
	// 										lon: 120,
	// 										lat: 22,
	// 										depth: 20,
	// 										mag: 6.8,
	// 										loc: "高雄市南部外海",
	// 										max: 6,
	// 										area: {},
	// 									},
	// 								}, Date.now());
	// 								setTimeout(() => {
	// 									eew({
	// 										type: "eew",
	// 										author: "trem",
	// 										detail: 1,
	// 										level: 1,
	// 										id: 12345,
	// 										serial: 9,
	// 										status: 1,
	// 										reason: 0,
	// 										final: 0,
	// 										trigger: 0,
	// 										rts: 1,
	// 										eq: {
	// 											time: Date.now() - 12000,
	// 											lon: 120,
	// 											lat: 22,
	// 											depth: 20,
	// 											mag: 7.5,
	// 											loc: "高雄市南部外海",
	// 											max: 6,
	// 											area: {},
	// 										},
	// 									}, Date.now());
	// 									setTimeout(() => {
	// 										eew({
	// 											type: "eew",
	// 											author: "trem",
	// 											detail: 1,
	// 											level: 1,
	// 											id: 12345,
	// 											serial: 10,
	// 											status: 3,
	// 											reason: 0,
	// 											final: 0,
	// 											trigger: 0,
	// 											rts: 1,
	// 											eq: {
	// 												time: Date.now() - 12000,
	// 												lon: 0,
	// 												lat: 0,
	// 												depth: 0,
	// 												mag: 0,
	// 												loc: "高雄市南部外海",
	// 												max: 0,
	// 												area: {},
	// 											},
	// 										}, Date.now());
	// 									}, 5000);
	// 								}, 1000);
	// 							}, 1000);
	// 						}, 1000);
	// 					}, 1000);
	// 				}, 1000);
	// 			}, 1000);
	// 		}, 1000);
	// 	}, 1000);
	// }, 30000);
};

function generateUniqueId() {
	return Math.random().toString(36).substr(2, 9);
}

function intensity_area(global_data, _intensity) {
	const sortKey = Object.keys(_intensity).sort((a, b) => b - a);
	let output = "";
	const city_list = [];
	for (let i = 0; i < sortKey.length; i++) {
		const key = sortKey[i];
		const loc_list = [];
		for (const loc of _intensity[key]) {
			const loc_area = search_loc(global_data, loc);
			if (loc_area != undefined && !loc_list.includes(loc_area.city) && !city_list.includes(loc_area.city)) {
				loc_list.push(loc_area.city);
				city_list.push(loc_area.city);
			}
		}
		if (!loc_list.length) continue;
		const str = `[震度 ${intensity_int_to_string(key).replace("級", "")}]　${loc_list.join("、")}\n`;
		const new_str = output + str;
		if (new_str.length > 50) break;
		output += str;
	}
	return {
		str: output,
	};
}

function search_loc(global_data, int) {
	for (const city of Object.keys(global_data.region))
		for (const town of Object.keys(global_data.region[city]))
			if (global_data.region[city][town].code == int) {
				let display = city;
				if (town != "東區" && town != "西區" && town != "南區" && town != "北區" && town.length > 2) display += town.replace("鄉", "").replace("鎮", "").replace("市", "").replace("區", "");
				else display += town;
				return { area: global_data.region[city][town].area, name: city + town, display, city };
			}
	return undefined;
}

function format_str(locations) {
	locations = locations.split("、");
	const locationGroups = locations.reduce((acc, location) => {
		const match = location.match(/^(.*?[縣市])(.*)$/);
		if (match) {
			const [_, county, town] = match;
			if (!acc[county])
				acc[county] = [];
			acc[county].push(town);
		}
		return acc;
	}, {});

	return Object.keys(locationGroups).map(county => `${county}(${locationGroups[county].join("、")})`).toString().replaceAll(",", " ");
}

function dc_eew(embed) {
	webhook(config.TREM_EEW_WEBHOOK, {
		"username"   : "ExpTech | 探索科技 (測試)",
		"avatar_url" : "https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/ExpTech.jpg",
		"embeds"     : embed,
	});
}

function dc_intensity(embed) {
	webhook(config.TREM_INTENSITY_WEBHOOK, {
		"username"   : "ExpTech | 探索科技 (測試)",
		"avatar_url" : "https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/ExpTech.jpg",
		content      : "<@&1245668894056644650>",
		"embeds"     : embed,
	});

	if (config.side == "SERVER" && config.LOCATION == "臺南") webhook(process.env.TREM_INTENSITY_WEBHOOK_2, {
		"username"   : "ExpTech | 探索科技 (測試)",
		"avatar_url" : "https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/ExpTech.jpg",
		content      : "<@&1224889331999838280>",
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

async function write(logger, data) {
	let conn;
	try {
		conn = await pool.getConnection();
		const insertQuery = `
            INSERT INTO eew (
                ID, Data, Send, Eq
            ) VALUES (
                ?, ?, ?, ?
            );
        `;
		const values = [
			data.ID, data.Data, data.Send, data.Eq,
		];
		await conn.query(insertQuery, values);
	} catch (err) {
		logger.error("8" + err);
	} finally {
		if (conn) conn.release();
	}
}

async function write_intensity(logger, data) {
	let conn;
	try {
		conn = await pool.getConnection();
		const insertQuery = `
            INSERT INTO intensity (
                ID, Data, Send
            ) VALUES (
                ?, ?, ?
            );
        `;
		const values = [
			data.ID, data.Data, data.Send,
		];
		await conn.query(insertQuery, values);
	} catch (err) {
		logger.error("9" + err);
	} finally {
		if (conn) conn.release();
	}
}