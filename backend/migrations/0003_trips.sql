-- A booked trip: where and when someone's going. On its first day their place switches to the trip's city (once; they
-- can switch it back), and after its last day back to where they were, if they're still set to the trip's city.
CREATE TABLE IF NOT EXISTS trips (
	user_id VARCHAR(32) NOT NULL,
	place_name VARCHAR(200) NOT NULL,
	lat FLOAT NOT NULL,
	lon FLOAT NOT NULL,
	start_date VARCHAR(10) NOT NULL,
	end_date VARCHAR(10) NOT NULL,
	home_name VARCHAR(200),
	home_lat FLOAT,
	home_lon FLOAT,
	state VARCHAR(8) NOT NULL DEFAULT 'booked',
	created_at DATETIME NOT NULL,
	PRIMARY KEY (user_id),
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
