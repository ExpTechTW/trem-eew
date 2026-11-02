const mqtt = require("mqtt");

const options = {
	host     : process.env.MQTT_HOST,
	port     : 1883,
	protocol : "mqtt",
	username : process.env.MQTT_USERNAME,
	password : process.env.MQTT_PASSWORD,
};

const client = mqtt.connect(options);

client.on("connect", () => {
	console.log("Connected to MQTT broker");
	client.subscribe("/EEWS/Alarm/158/63/99", (err) => {
		if (!err) console.log("Subscribed to topic");
		client.publish("/EEWS/Alarm/158/63/99", JSON.stringify({
			"AlarmSentTime"  : "2024-01-31T12:26:33.345273771Z",
			"MessageContent" : {
				"AlarmType" : "Finish",
				"PGAx"      : 0,
				"PGAr"      : 0,
				"PGVx"      : 0,
				"PGVr"      : 0,
				"Ix"        : 0,
				"Ir"        : 0,
				"MMIx"      : "I",
				"MMIr"      : "I",
			},
		}));
	});
});

client.on("message", (topic, msg) => {
	const data = JSON.parse(msg.toString());
	console.log(`Received message: on topic ${topic}`);
	console.log(data);
});