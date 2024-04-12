import express from "express";

import config from "./utils/config";
import log from "./utils/logger";

const app = express();

app.get("/api/v1/objects", (req, res) => {
	res.json({
		status: 200,
		objects: [
			{
				name: "Airtag płaszcz",
				locations: [
					{
						latitude: 52.5,
						longitude: 21.1,
						timestamp: 1631435600,
					},
					{
						latitude: 52.22977,
						longitude: 21.01178,
						timestamp: 1631535600,
					},
					{
						latitude: 52.3,
						longitude: 21.02,
						timestamp: 1631545700,
					},
				],
			},
		],
	});
});

app.use(express.static("public"));

app.listen(config.http.port, () => {
	log.info(`Server started on port ${config.http.port}`, "HTTP");
});
