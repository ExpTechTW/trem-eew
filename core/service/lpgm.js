const config = require("../../config");
const { formatTime } = require("../../utils/utils");

const mariadb = require("mariadb");
const puppeteer = require("puppeteer");
const path = require("path");

const pool = mariadb.createPool({
	host            : "mariadb",
	user            : "root",
	password        : process.env.DB_PASSWORD,
	database        : "exptech",
	connectionLimit : 5,
});

const { ThreadsAPI } = require("threads-api");

const threadsAPI = new ThreadsAPI({
	username : process.env.THREADS_USERNAME,
	password : process.env.THREADS_PASSWORD,
});

const { TwitterApi } = require("twitter-api-v2");

const twitterClient = new TwitterApi({
	appKey       : process.env.TWITTER_APP_KEY,
	appSecret    : process.env.TWITTER_APP_SECRET,
	accessToken  : process.env.TWITTER_ACCESS_TOKEN,
	accessSecret : process.env.TWITTER_ACCESS_SECRET,
});

const rwClient = twitterClient.readWrite;

let lock = false;

async function captureMap(EQ) {
	const browser = await puppeteer.launch({
		executablePath  : process.env.PUPPETEER_EXECUTABLE_PATH,
		args            : ["--no-sandbox", "--disable-setuid-sandbox"],
		protocolTimeout : 60000,
	});

	const page = await browser.newPage();
	await page.setViewport({ width: 1038, height: 691 });

	const absolutePath = "file://" + path.resolve("./core/images/lpgm.html");
	await page.evaluateOnNewDocument((eq) => {
		// eslint-disable-next-line no-undef
		window.EQ = eq;
	}, EQ);
	await page.goto(absolutePath);
	await page.waitForSelector("#map");

	await page.screenshot({
		path     : (config.side == "LOCAL") ? `./lpgm/${EQ.time}.png` : `/images/lpgm/${EQ.time}.jpg`,
		fullPage : true,
		type     : "jpeg",
		quality  : 100,
	});

	await browser.close();

	if (config.LOCATION == "臺南") lpgm_dc(EQ);
}

module.exports = (global_data, logger) => {
	if (config.side == "SERVER")
		setInterval(async () => {
			if (lock) return;
			lock = true;

			const currentTime = Date.now();
			global_data.data.lpgm = global_data.data.lpgm.filter(item => {
				const timeDiff = currentTime - item.send;
				return timeDiff <= 300000;
			});

			try {
				const data = await fetchRowsWithNullLpgm(logger);
				if (data)
					for (const report of data) {
						if (!report.List) continue;
						if (global_data.time_now - Number(report.ID) > 86400000 && report.Lpgm != -1) continue;
						const list = JSON.parse(report.List);
						const array = await fetchRowsByIdList(logger, list);
						let max = 0;
						if (array && array.length == list.length) {
							const lpgm_list = [];
							for (const raw of array) {
								const station = JSON.parse(raw.Data);
								lpgm_list.push(station);
								if (station.lpgm > max) max = station.lpgm;
							}
							if (max) {
								await captureMap({
									time         : Number(report.ID),
									max,
									list         : lpgm_list,
									station_info : global_data.station_info,
								});

								const res = filterProperties(lpgm_list);

								write_lpgm(logger, {
									ID   : report.ID,
									Send : formatTime(global_data.time_now),
									Data : JSON.stringify({
										max  : max,
										list : res,
									}),
								});

								const json = {
									author : "trem",
									id     : report.ID,
									max    : max,
									list   : res,
									send   : currentTime,
								};

								global_data.data.lpgm.push(json);
							}
							await updateLpgmById(logger, report.ID, max);
						}
						break;
					}
			} catch (err) {
				logger.error(`LPGM -> ${err}`);
			}
			lock = false;
		}, 60000);
};

function filterProperties(data) {
	const keepProperties = ["id", "lpgm", "sva", "sva30"];

	return data.map(item => {
		const filteredItem = {};

		keepProperties.forEach(prop => {
			if (prop in item)
				filteredItem[prop] = item[prop];
		});

		return filteredItem;
	});
}

async function fetchRowsWithNullLpgm(log) {
	let conn;
	try {
		conn = await pool.getConnection();
		const query = `
            SELECT ID, List, Cwa_id, Lpgm FROM trem_report WHERE Lpgm IS NULL OR Lpgm = -1;
        `;
		const rows = await conn.query(query);
		return rows;
	} catch (err) {
		log.error("16" + err);
		return null;
	} finally {
		if (conn) conn.release();
	}
}

function lpgm_dc(data) {
	dc([
		{
			"title"       : "長周期地震動 觀測資訊",
			"description" : `**${formatTime_intensity(data.time)}** 左右,\n觀測到 **最大階級${data.max}** 的長周期地震動。\n(僅供參考 以 中央氣象署 發布之內容為準)\n[ExpTech Studio](https://exptech.com.tw/dc)\n[下載圖片](https://api-1.exptech.dev/file/images/lpgm/${data.time}.jpg)`,
			"color"       : int_to_color(data.max),
			"image"       : {
				"url": `https://api-1.exptech.dev/file/images/lpgm/${data.time}.jpg`,
			},
			"footer": {
				"text"     : "ExpTech Studio 2023",
				"icon_url" : "https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/ExpTech.jpg",
			},
			"timestamp": new Date(),
		},
	]);

	tweetWithMedia(`[長周期地震動 觀測資訊]\n${formatTime_intensity(data.time)} 左右,\n觀測到 最大階級${data.max} 的長周期地震動。\n(僅供參考以 中央氣象署 發布之內容為準)\nExpTech Studio Ltd.\nhttps://exptech.com.tw/dc`, `https://api-1.exptech.dev/file/images/lpgm/${data.time}.jpg`);

	threadsAPI.publish({
		text       : `[長周期地震動 觀測資訊]\n${formatTime_intensity(data.time)} 左右,\n觀測到 最大階級${data.max} 的長周期地震動。\n(僅供參考以 中央氣象署 發布之內容為準)\nExpTech Studio Ltd.\n手機版 -> https://exptech.com.tw/dpip`,
		attachment : {
			image:
			`https://api-1.exptech.dev/file/images/lpgm/${data.time}.jpg`,
		},
	}).catch(err => console.log(err));
}

function dc(embed, url = process.env.LPGM_WEBHOOK) {
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
	const list = [0, 16895, 16770560, 16721920, 10813473];
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

async function fetchRowsByIdList(log, idList) {
	let conn;
	try {
		conn = await pool.getConnection();
		const formattedIdList = idList.map(id => `'${id}'`).join(",");
		const query = `
		SELECT * FROM wave_info
		WHERE ID IN (${formattedIdList})
	  `;
		const rows = await conn.query(query);
		return rows.length === idList.length ? rows : null;
	} catch (err) {
		log.error("17" + err);
		return null;
	} finally {
		if (conn) conn.release();
	}
}


async function updateLpgmById(log, id, newLpgm) {
	let conn;
	try {
		conn = await pool.getConnection();
		const query = `
            UPDATE trem_report
            SET Lpgm = ?
            WHERE ID = ?;
        `;
		await conn.query(query, [newLpgm, id]);
	} catch (err) {
		log.error("18" + err);
		return null;
	} finally {
		if (conn) conn.release();
	}
}

async function write_lpgm(logger, data) {
	let conn;
	try {
		conn = await pool.getConnection();
		const insertQuery = `
            INSERT INTO lpgm (
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
		logger.error("7" + err);
	} finally {
		if (conn) conn.release();
	}
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
