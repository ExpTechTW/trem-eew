const config = require("../../config");
const { parseJSON } = require("../../utils/utils");

const WebSocket = require("ws");

let ntp = 0;
let ws;

module.exports = (global_data, logger) => {
	function connect() {
		if (ws && ws.readyState === WebSocket.OPEN) ws.close();

		ws = null;

		ws = new WebSocket((config.side == "SERVER") ? "ws://raw:30001" : "ws://raw.exptech.com.tw:30001");

		ws.onopen = () => {
			ntp = Date.now();
			logger.info("連接已建立");
		};

		ws.onmessage = (e) => {
			try {
				const data = parseJSON(e.data.toString());
				if (data)
					if (data.type == "ntp") ntp = Date.now();
					else if (data.type == "data") {
						if (data.boot || !data.X || !data.Y || !data.Z) return;
						if ((data.time ?? 0) < 1000000000000) return;
						if (global_data.time_now - data.time > 3000) return;
						global_data.time_now = global_data.time.syncedTime + (Date.now() - global_data.time.lastSync);
						const Net = global_data.station_info[data.id]?.net;
						if (Net)
							for (let i = 0; i < data.Z.length; i++) {
								const _data = {
									Net,
									time : data.time + ((Net == "SE-Net") ? 50 : 20) * i,
									ID   : data.id,
									X    : parseFloat(data.X[i]),
									Y    : parseFloat(data.Y[i]),
									Z    : parseFloat(data.Z[i]),
								};
								global_data.events.emit("data", _data);
							}
					}
			} catch (err) {
				console.log(err);
			}
		};

		ws.onclose = () => {
			logger.warn("連接已關閉，正在嘗試重連...");
		};

		ws.onerror = (error) => {
			logger.error("發生錯誤:", error);
		};
	}
	connect();

	setInterval(() => {
		if (Date.now() - ntp > 2500) connect();
	}, 3000);
};