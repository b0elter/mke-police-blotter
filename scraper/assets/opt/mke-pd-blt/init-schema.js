const pg = require('pg');
const client = new pg.Client();
client.connect();

client.query(`
    CREATE EXTENSION pgcrypto;
    CREATE TABLE IF NOT EXISTS calls
    (
        id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        number    BIGINT NOT NULL,
        date_time TIMESTAMP        DEFAULT NOW(),
        location  TEXT             DEFAULT 'Unknown',
        district  SMALLINT         DEFAULT -1,
        nature    TEXT             DEFAULT 'Unknown',
        status    TEXT             DEFAULT 'Unknown',
        latitude  REAL,
        longitude REAL,
        UNIQUE(number, date_time)
    );
    CREATE INDEX calls_idx_number ON calls (number);
    CREATE INDEX calls_idx_date_time ON calls (date_time);
    CREATE INDEX calls_idx_location ON calls (location);
    CREATE INDEX calls_idx_district ON calls (district);
    CREATE INDEX calls_idx_nature ON calls (nature);
    CREATE INDEX calls_idx_status ON calls (status);
`, (err, res) => {
    if (err) {
        console.log(err);
        process.exit(1);
    }
    console.log('Schema initialized...');
    client.end();
    process.exit(0);
});
