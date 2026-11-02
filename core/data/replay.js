const { formatTime } = require("../../utils/utils");

const mariadb = require("mariadb");

const pool = mariadb.createPool({
	host            : process.env.REPLAY_DB_HOST,
	user            : "root",
	password        : process.env.DB_PASSWORD,
	database        : "exptech",
	connectionLimit : 5,
});

// let sql_time = "2024-04-23 04:49:50";
let sql_time = "2025-10-8 7:52:0";

sql_time = Math.floor(new Date(sql_time).getTime() / 1000);

module.exports = async (global_data, logger) => {
	let sql_lock = false;

	global_data.time_now = sql_time * 1000;
	const conn = await pool.getConnection();

	setInterval(async () => {
		if (sql_lock) return;
		sql_lock = true;

		const query = `
					SELECT Time, Data FROM raw
					WHERE Time = ?`;

		const rows = await conn.query(query, [formatTime(sql_time * 1000)]);

		sql_time++;
		global_data.time_now = sql_time * 1000;
		sql_lock = false;

		if (!rows.length) return;

		console.log(rows[0].Time);
		rows[0].Data = JSON.parse(rows[0].Data);

		for (const station of Object.keys(rows[0].Data)) {
			const _data = rows[0].Data[station];
			const Net = global_data.station_info[station]?.net;
			if (Net)
				for (const row of _data) {
					const [offsetMs, x, y, z] = row.split(" ");
					const _data_ = {
						Net,
						time : new Date(new Date(rows[0].Time).getTime() + parseInt(offsetMs)).getTime(),
						ID   : station,
						X    : parseFloat(x),
						Y    : parseFloat(y),
						Z    : parseFloat(z),
					};
					global_data.events.emit("data", _data_);
				}
		}
	}, 1000);

	global_data.broadcast = broadcast;
};

function broadcast(message) {
	// console.log(message.data);
}