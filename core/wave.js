let lock = false;

module.exports = (global_data, logger) => {
	setInterval(() => {
		if (!global_data.wave_list.length || lock) return;
		for (let i = global_data.wave_list.length - 1; i >= 0; i--)
			if (global_data.wave_list[i].time < global_data.time_now) {
				if (global_data.wave_alert_list.includes(global_data.wave_list[i].data.wave_id)) {
					global_data.wave_list[i].data.alert = true;
					global_data.wave_alert_list.splice(global_data.wave_alert_list.indexOf(global_data.wave_list[i].data.wave_id), 1);
				}

				lock = true;

				fetch("http://rts-wave:20007/api/v1/trem/wave", {
					method  : "POST",
					headers : { "Content-Type": "application/json" },
					body    : JSON.stringify(global_data.wave_list[i].data),
				})
					.then(ans => ans.json())
					.then(ans => {
						if (ans.success) global_data.wave_list.splice(i, 1);
					})
					.catch(err => logger.error(`[wave] send to wave server ${global_data.wave_list[i].data.id} failed: ${err.message}`))
					.finally(() => lock = false);
			}
	}, 15000);
};