-- Friends on the street: codes to add each other with, who's friends with whom, who opened snug today (their city,
-- outfit and how the day feels), and the reactions waiting in each mailbox.
CREATE TABLE IF NOT EXISTS friend_codes (
	user_id VARCHAR(32) NOT NULL,
	code VARCHAR(12) NOT NULL,
	hide_city INTEGER NOT NULL DEFAULT 0,
	card TEXT,
	created_at DATETIME NOT NULL,
	PRIMARY KEY (user_id),
	UNIQUE (code),
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS friends (
	user_id VARCHAR(32) NOT NULL,
	friend_id VARCHAR(32) NOT NULL,
	created_at DATETIME NOT NULL,
	PRIMARY KEY (user_id, friend_id),
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE,
	FOREIGN KEY(friend_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS presence (
	user_id VARCHAR(32) NOT NULL,
	local_date VARCHAR(10) NOT NULL,
	city VARCHAR(200) NOT NULL,
	lat FLOAT,
	lon FLOAT,
	score INTEGER NOT NULL,
	label VARCHAR(40) NOT NULL,
	outfit JSON NOT NULL,
	condition VARCHAR(16) NOT NULL,
	night INTEGER NOT NULL DEFAULT 0,
	updated_at DATETIME NOT NULL,
	PRIMARY KEY (user_id),
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS reactions (
	id INTEGER NOT NULL,
	from_id VARCHAR(32) NOT NULL,
	to_id VARCHAR(32) NOT NULL,
	kind VARCHAR(8) NOT NULL,
	local_date VARCHAR(10) NOT NULL,
	seen INTEGER NOT NULL DEFAULT 0,
	discarded INTEGER NOT NULL DEFAULT 0,
	created_at DATETIME NOT NULL,
	PRIMARY KEY (id),
	UNIQUE (from_id, to_id, kind, local_date),
	FOREIGN KEY(from_id) REFERENCES users (id) ON DELETE CASCADE,
	FOREIGN KEY(to_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_reactions_to ON reactions (to_id, seen);
CREATE TABLE IF NOT EXISTS statuses (
	id INTEGER NOT NULL,
	user_id VARCHAR(32) NOT NULL,
	feeling VARCHAR(24) NOT NULL,
	text VARCHAR(140) NOT NULL DEFAULT '',
	created_at DATETIME NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_statuses_user ON statuses (user_id, created_at);
