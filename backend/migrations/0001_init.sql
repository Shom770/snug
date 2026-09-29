-- snug schema (SQLite / Cloudflare D1)
CREATE TABLE users (
	id VARCHAR(32) NOT NULL, 
	email VARCHAR(320) NOT NULL, 
	name VARCHAR(200), 
	picture VARCHAR(1000), 
	google_sub VARCHAR(64), 
	created_at DATETIME NOT NULL, 
	last_seen_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (google_sub)
);
CREATE UNIQUE INDEX ix_users_email ON users (email);
CREATE TABLE sessions (
	token_hash VARCHAR(64) NOT NULL, 
	user_id VARCHAR(32) NOT NULL, 
	created_at DATETIME NOT NULL, 
	expires_at DATETIME NOT NULL, 
	user_agent VARCHAR(400), 
	PRIMARY KEY (token_hash), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX ix_sessions_user_id ON sessions (user_id);
CREATE TABLE preferences (
	user_id VARCHAR(32) NOT NULL, 
	place_name VARCHAR(200), 
	lat DOUBLE, 
	lon DOUBLE, 
	units VARCHAR(4) NOT NULL, 
	onboarded BOOLEAN NOT NULL, 
	tuning JSON, 
	updated_at DATETIME NOT NULL, avatar JSON, 
	PRIMARY KEY (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE TABLE forecasts (
	id INTEGER NOT NULL, 
	user_id VARCHAR(32), 
	city VARCHAR(200) NOT NULL, 
	local_date VARCHAR(10) NOT NULL, 
	start_hour INTEGER NOT NULL, 
	score INTEGER NOT NULL, 
	label VARCHAR(40) NOT NULL, 
	factor VARCHAR(16) NOT NULL, 
	curve JSON NOT NULL, 
	outfit JSON NOT NULL, 
	weather JSON NOT NULL, 
	model VARCHAR(80) NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX ix_forecasts_user_id ON forecasts (user_id);
CREATE TABLE checkins (
	id INTEGER NOT NULL, 
	user_id VARCHAR(32) NOT NULL, 
	forecast_id INTEGER NOT NULL, 
	city VARCHAR(200) NOT NULL, 
	local_date VARCHAR(10) NOT NULL, 
	felt INTEGER NOT NULL, 
	fit VARCHAR(12), 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (user_id, local_date, city), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(forecast_id) REFERENCES forecasts (id) ON DELETE CASCADE
);
CREATE INDEX ix_checkins_user_id ON checkins (user_id);
CREATE TABLE tune_picks (
	id INTEGER NOT NULL, 
	user_id VARCHAR(32) NOT NULL, 
	a JSON NOT NULL, 
	b JSON NOT NULL, 
	pick VARCHAR(1) NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX ix_tune_picks_user_id ON tune_picks (user_id);
