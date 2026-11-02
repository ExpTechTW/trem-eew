const { formatTime } = require("../../utils/utils");

const fs = require("fs-extra");
const crypto = require("crypto");
const fastify = require("fastify")();
const cors = require("@fastify/cors");
const mariadb = require("mariadb");

const MAX_CONNECT = 50;

const pool = mariadb.createPool({
	host               : "mariadb",
	user               : "root",
	password           : process.env.DB_PASSWORD,
	database           : "exptech",
	connectionLimit    : MAX_CONNECT,
	acquireTimeout     : 3000,
	connectTimeout     : 10000,
	multipleStatements : true,
	idleTimeout        : 60000,
});

function checkDbPoolMiddleware(reply) {
	const active = pool.activeConnections();
	if (active >= MAX_CONNECT) {
		reply.code(503).send();
		return false;
	}
	return true;
}

module.exports = async (global_data, logger) => {
	fastify.register(cors, {
		origin  : "*",
		methods : "GET,HEAD,PUT,PATCH,POST,DELETE",
	});
	fastify.setNotFoundHandler((req, reply) => {
		reply.code(404).send({
			status : "error",
			error  : {
				"message" : "Not Found",
				"code"    : 404,
			},
		});
	});

	fastify.register(async (_fastify, options) => {
		_fastify.get("/", (req, reply) => {
			reply.send(global_data.data.rts);
		});
		_fastify.get("/:time", async (req, reply) => {
			const allowed = checkDbPoolMiddleware(reply);
			if (!allowed) return;

			const time = req.params.time;
			const T = formatTime(Number(time));
			if (T.includes("NaN")) return {
				station : {},
				box     : {},
				int     : [],
				time    : 0,
			};
			const raw = await fetchRtsByTime(logger, T);
			if (raw) reply.send(JSON.parse(raw.Data));
			else reply.status(404).send();
		});
	}, { prefix: "/api/v1/trem/rts" });

	fastify.register(async (_fastify, options) => {
		_fastify.get("/", (req, reply) => {
			reply.send(global_data.data.rts);
		});
		_fastify.get("/:time", async (req, reply) => {
			const allowed = checkDbPoolMiddleware(reply);
			if (!allowed) return;

			const time = req.params.time;
			const T = formatTime(Number(time) * 1000);
			if (T.includes("NaN")) return {
				station : {},
				box     : {},
				int     : [],
				time    : 0,
			};
			const raw = await fetchRtsByTime(logger, T);
			if (raw) reply.send((typeof raw == "object") ? raw.Data : JSON.parse(raw.Data));
			else reply.status(404).send();
		});
	}, { prefix: "/api/v2/trem/rts" });

	fastify.register(async (_fastify, options) => {
		_fastify.get("/", (req, reply) => {
			const data = JSON.stringify(global_data.station_info);
			const etag = crypto.createHash("md5").update(data).digest("hex");
			const ifNoneMatch = req.headers["if-none-match"];

			if (ifNoneMatch === `"${etag}"` || ifNoneMatch === etag) {
				reply.code(304).send();
				return;
			}

			reply.header("ETag", `"${etag}"`);
			reply.send(global_data.station_info);
		});
	}, { prefix: "/api/v1/trem/station" });

	fastify.register(async (_fastify, options) => {
		_fastify.get("/", async (req, reply) => {
			const allowed = checkDbPoolMiddleware(reply);
			if (!allowed) return;

			let { limit } = req.query;
			if (!limit || isNaN(Number(limit))) limit = 100;
			if (limit > 7500) limit = 7500;
			reply.send(await fetchTremReports(logger, limit));
		});
		_fastify.get("/:id", async (req, reply) => {
			const allowed = checkDbPoolMiddleware(reply);
			if (!allowed) return;

			const id = req.params.id;
			reply.send(await fetchTremReportById(logger, id));
		});
	}, { prefix: "/api/v1/trem/list" });

	fastify.register(async (_fastify, options) => {
		_fastify.get("/", async (req, reply) => {
			const allowed = checkDbPoolMiddleware(reply);
			if (!allowed) return;

			reply.send(await fetchMonthlyTremReportCounts(logger));
		});
		_fastify.get("/:month", async (req, reply) => {
			const allowed = checkDbPoolMiddleware(reply);
			if (!allowed) return;

			const month = req.params.month;
			reply.send(await fetchTremMonthReports(logger, month));
		});
	}, { prefix: "/api/v1/trem/month" });

	fastify.register(async (_fastify, options) => {
		_fastify.post("/", async (req, reply) => {
			const allowed = checkDbPoolMiddleware(reply);
			if (!allowed) return;

			const data = req.body;
			const info = await fetchRowsByIdList(logger, data.list);
			const ans = [];
			for (const i of info) {
				const raw = JSON.parse(i.Data);
				ans.push({
					ID: i.ID,
					...raw,
				});
			}
			reply.send(ans);
		});
	}, { prefix: "/api/v1/trem/info" });

	fastify.register(async (_fastify, options) => {
		_fastify.get("/", async (req, reply) => global_data.data.intensity);

		_fastify.get("/:time", async (req, res) => {
			const allowed = checkDbPoolMiddleware(res);
			if (!allowed) return;

			const time = req.params.time;
			const T = formatTime(Number(time));
			const ans = [];

			if (T.includes("NaN")) return ans;

			const data = await fetchIntensityRange(logger, T);

			for (const intensity of data) {
				const json = JSON.parse(intensity.Data);

				const ID = intensity.ID.split("-");

				const raw = {
					author : "trem",
					id     : Number(ID[0]),
					alert  : json.alert,
					serial : Number(ID[1]),
					final  : json.final,
					area   : json.area,
					max    : json.max,
				};

				const index = ans.findIndex(item => item.id == raw.id);
				if (index != -1) ans[index] = raw;
				else ans.push(raw);
			}

			return ans;
		});
	}, { prefix: "/api/v1/trem/intensity" });

	fastify.register(async (_fastify, options) => {
		_fastify.get("/", async (req, reply) => global_data.data.intensity);

		_fastify.get("/:time", async (req, res) => {
			const allowed = checkDbPoolMiddleware(res);
			if (!allowed) return;

			const time = req.params.time;
			const T = formatTime(Number(time) * 1000);
			const ans = [];

			if (T.includes("NaN")) return ans;

			const data = await fetchIntensityRange(logger, T);

			for (const intensity of data) {
				const json = JSON.parse(intensity.Data);

				const ID = intensity.ID.split("-");

				const raw = {
					author : "trem",
					id     : Number(ID[0]),
					alert  : json.alert,
					serial : Number(ID[1]),
					final  : 0,
					area   : json.area,
					max    : json.max,
				};

				const index = ans.findIndex(item => item.id == raw.id);
				if (index != -1) ans[index] = raw;
				else ans.push(raw);
			}

			return ans;
		});
	}, { prefix: "/api/v2/trem/intensity" });

	fastify.register(async (_fastify, options) => {
		_fastify.get("/", async (req, reply) => global_data.data.lpgm);

		_fastify.get("/:time", async (req, res) => {
			const allowed = checkDbPoolMiddleware(res);
			if (!allowed) return;

			const time = req.params.time;
			const T = formatTime(Number(time));
			const ans = [];

			if (T.includes("NaN")) return ans;

			const data = await fetchLpgmRange(logger, T);

			for (const intensity of data) {
				const json = JSON.parse(intensity.Data);

				const raw = {
					author : "trem",
					id     : intensity.ID,
					list   : json.list,
					max    : json.max,
				};

				const index = ans.findIndex(item => item.id == raw.id);
				if (index != -1) ans[index] = raw;
				else ans.push(raw);
			}

			return ans;
		});
	}, { prefix: "/api/v1/trem/lpgm" });

	fastify.register(async (_fastify, options) => {
		_fastify.get("/", async (req, reply) => global_data.data.lpgm);

		_fastify.get("/:time", async (req, res) => {
			const allowed = checkDbPoolMiddleware(res);
			if (!allowed) return;

			const time = req.params.time;
			const T = formatTime(Number(time) * 1000);
			const ans = [];

			if (T.includes("NaN")) return ans;

			const data = await fetchLpgmRange(logger, T);

			for (const intensity of data) {
				const json = JSON.parse(intensity.Data);

				const raw = {
					author : "trem",
					id     : intensity.ID,
					list   : json.list,
					max    : json.max,
				};

				const index = ans.findIndex(item => item.id == raw.id);
				if (index != -1) ans[index] = raw;
				else ans.push(raw);
			}

			return ans;
		});
	}, { prefix: "/api/v2/trem/lpgm" });

	fastify.register(async (_fastify, options) => {
		_fastify.get("/:id", async (req, reply) => {
			const allowed = checkDbPoolMiddleware(reply);
			if (!allowed) return;

			const id = req.params.id;

			const trem = await fetchTremEEW(logger, `${id}-`);

			const ans = [];

			for (const eew of trem) {
				const data = JSON.parse(eew.Data);
				ans.push({
					status  : data.status,
					final   : data.final,
					rts     : data.rts,
					detail  : data.detail,
					reason  : data.reason,
					trigger : data.trigger,
					eq      : {
						time  : new Date(eew.Eq).getTime(),
						lon   : data.eq.lon,
						lat   : data.eq.lat,
						depth : data.eq.depth,
						mag   : data.eq.mag,
						loc   : data.eq.loc,
						max   : data.eq.max,
					},
					time: new Date(eew.Send).getTime(),
				});
			}

			reply.send(ans);
		});
	}, { prefix: "/api/v1/trem/report" });

	fastify.register(async (_fastify, options) => {
		_fastify.get("/add/:id", async (req, reply) => {
			if (req.query.key != process.env.WS_KEY) return null;
			const id = Number(req.params.id);
			// const keysAsNumbers = Object.keys(global_data.station_info).map(key => Number(key));
			// if (!keysAsNumbers.includes(id)) return null;
			if (!id) return null;
			if (!global_data.freeze_list.includes(id)) {
				global_data.freeze_list.push(id);
				fs.writeFile("./resource/freeze.json", JSON.stringify(global_data.freeze_list), () => void 0);
			}
			return true;
		});
		_fastify.get("/remove/:id", async (req, reply) => {
			if (req.query.key != process.env.WS_KEY) return null;
			const id = Number(req.params.id);
			if (global_data.freeze_list.includes(id)) {
				global_data.freeze_list.splice(global_data.freeze_list.indexOf(id), 1);
				fs.writeFile("./resource/freeze.json", JSON.stringify(global_data.freeze_list), () => void 0);
			}
			return true;
		});
		_fastify.get("/list", async (req, reply) => {
			const keysAsNumbers = Object.keys(global_data.freeze_station).map(key => Number(key));
			return {
				auto : keysAsNumbers,
				list : global_data.freeze_list,
			};
		});
	}, { prefix: "/api/v1/trem/freeze" });

	fastify.listen({ port: 20003, host: "0.0.0.0" }, err => {
		if (err) throw err;
		logger.info("Http 伺服器 已啟動");
	});

	const heart = require("fastify")();
	heart.register(async (_fastify, options) => {
		_fastify.get("*", (req, reply) => reply.send("OK"));
	}, { prefix: "/" });
	heart.listen({ port: 40003, host: "0.0.0.0" }, err => {
		if (err) throw err;
		logger.info("Heart Server started");
	});
};

async function fetchLpgmRange(log, specifiedTime) {
	let conn;
	try {
		conn = await pool.getConnection();
		const query = `
            SELECT *, TIMESTAMPDIFF(SECOND, Send, ?) AS TimeDifference 
            FROM lpgm 
            WHERE TIMESTAMPDIFF(SECOND, Send, ?) < 60
              AND ? > Send
            ORDER BY Send ASC;
        `;
		const rows = await conn.query(query, [specifiedTime, specifiedTime, specifiedTime]);
		return rows;
	} catch (err) {
		log.error("11" + err);
		return null;
	} finally {
		if (conn) conn.release();
	}
}

async function fetchIntensityRange(log, specifiedTime) {
	let conn;
	try {
		conn = await pool.getConnection();
		const query = `
            SELECT *, TIMESTAMPDIFF(SECOND, Send, ?) AS TimeDifference 
            FROM intensity 
            WHERE TIMESTAMPDIFF(SECOND, Send, ?) < 60
              AND ? > Send
            ORDER BY Send ASC;
        `;
		const rows = await conn.query(query, [specifiedTime, specifiedTime, specifiedTime]);
		return rows;
	} catch (err) {
		log.error("12" + err);
		return null;
	} finally {
		if (conn) conn.release();
	}
}

async function fetchTremMonthReports(logger, month) {
	let conn;
	try {
		conn = await pool.getConnection();
		const query = `
            SELECT * FROM trem_report
            WHERE FROM_UNIXTIME(CAST(ID AS INT)/1000, '%Y-%m') = '${month}'
            ORDER BY ID DESC
        `;
		const rows = await conn.query(query);
		return rows;
	} catch (err) {
		logger.error("2" + err);
		return null;
	} finally {
		if (conn) conn.release();
	}
}

async function fetchMonthlyTremReportCounts(logger) {
	let conn;
	try {
		conn = await pool.getConnection();
		const query = `
            SELECT 
                FROM_UNIXTIME(CAST(ID AS INT)/1000, '%Y-%m') AS month_year,
                COUNT(*) AS count
            FROM trem_report
            GROUP BY month_year
            ORDER BY month_year DESC;
        `;
		const rows = await conn.query(query);
		return rows.map(row => ({
			"year-month" : row.month_year,
			count        : Number(row.count),
		}));
	} catch (err) {
		logger.error("3" + err);
		return null;
	} finally {
		if (conn) conn.release();
	}
}

async function fetchRtsByTime(log, specifiedTime) {
	let conn;
	try {
		conn = await pool.getConnection();
		const query = `
            SELECT * FROM rts
            WHERE Time = ?
            LIMIT 1;
        `;
		const rows = await conn.query(query, [specifiedTime]);
		return rows[0];
	} catch (err) {
		log.error("14 " + ` ${specifiedTime} ` + err);
		return null;
	} finally {
		if (conn) conn.release();
	}
}

async function fetchTremReports(logger, limit) {
	let conn;
	try {
		conn = await pool.getConnection();
		const query = `
			SELECT * FROM trem_report
			ORDER BY ID DESC
			LIMIT ${limit};
		`;
		const rows = await conn.query(query);
		return rows;
	} catch (err) {
		logger.error("4" + err);
		return null;
	} finally {
		if (conn) conn.release();
	}
}

async function fetchTremReportById(logger, id) {
	let conn;
	try {
		conn = await pool.getConnection();
		const query = "SELECT * FROM trem_report WHERE ID = ?";
		const rows = await conn.query(query, [id]);
		return rows[0];
	} catch (err) {
		logger.error("5" + err);
		return null;
	} finally {
		if (conn) conn.release();
	}
}

async function fetchTremEEW(logger, searchPattern) {
	let conn;
	try {
		conn = await pool.getConnection();
		const query = `
            SELECT * FROM eew
            WHERE ID LIKE ?
            ORDER BY Send DESC
        `;
		const pattern = `%${searchPattern}%`;
		const rows = await conn.query(query, [pattern]);
		rows.sort((a, b) => {
			const numA = Number(a.ID.split("-")[1]);
			const numB = Number(b.ID.split("-")[1]);
			return numA - numB;
		});
		return rows;
	} catch (err) {
		logger.error("6" + err);
		return null;
	} finally {
		if (conn) conn.release();
	}
}

async function fetchRowsByIdList(log, idList) {
	let conn;
	try {
		conn = await pool.getConnection();
		const formattedIdList = idList.map(id => `'${id}'`).join(",");
		const query = `
            SELECT * FROM wave_info
            WHERE ID IN (${formattedIdList});
        `;
		const rows = await conn.query(query);
		return rows;
	} catch (err) {
		log.error("15" + err);
		return null;
	} finally {
		if (conn) conn.release();
	}
}