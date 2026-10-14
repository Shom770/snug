-- The numbers behind each forecast's hour-by-hour comfort scores (Jev's vote, any rain cap, the hour's weather), so the
-- app can show why an hour scored what it did, and how it was rated the forecast before.
CREATE TABLE IF NOT EXISTS forecast_why (
	forecast_id INTEGER NOT NULL,
	why JSON NOT NULL,
	PRIMARY KEY (forecast_id),
	FOREIGN KEY(forecast_id) REFERENCES forecasts (id) ON DELETE CASCADE
);
