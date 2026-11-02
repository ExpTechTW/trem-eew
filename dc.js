const { formatTime } = require("./utils/utils");

fetch(process.env.DC_TEST_WEBHOOK, {
	method  : "POST",
	headers : { "Content-Type": "application/json" },
	body    : JSON.stringify({
		"username"   : "ExpTech | 探索科技 (測試)",
		"avatar_url" : "https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/ExpTech.jpg",
		"embeds"     : [
			{
				"title"       : "🚨 緊急地震速報 | TREM EEW 第2報",
				"description" : "",
				"color"       : 16711680,
				"fields"      : [
					{
						"name"   : "位置",
						"value"  : "**臺東縣近海**",
						"inline" : true,
					},
					{
						"name"   : "規模",
						"value"  : "**6.4**",
						"inline" : true,
					},
					{
						"name"   : "深度",
						"value"  : "**10km**",
						"inline" : true,
					},
					{
						"name"   : "預估強烈搖晃地區",
						"value"  : "**臺東縣、__[花蓮縣]__**",
						"inline" : false,
					},
					{
						"name"   : "備註",
						"value"  : "**請做好應對強烈搖晃的準備**",
						"inline" : false,
					},
				],
				"footer": {
					"text"     : `ExpTech Studio 2023 | ${formatTime(Date.now())}`,
					"icon_url" : "https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/ExpTech.jpg",
				},
			},
		],
	}),
})
	.catch(err => console.error(err));