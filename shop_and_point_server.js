// -- init.sql

// -- shops table
// CREATE TABLE IF NOT EXISTS shops (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     shop_name TEXT NOT NULL,
//     created_at TEXT DEFAULT CURRENT_TIMESTAMP,
//     updated_at TEXT DEFAULT CURRENT_TIMESTAMP
// );

// -- shops_users table
// CREATE TABLE IF NOT EXISTS shops_users (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     shop_id INTEGER NOT NULL,
//     user_id INTEGER NOT NULL,
//     FOREIGN KEY (shop_id) REFERENCES shops(id),
//     FOREIGN KEY (user_id) REFERENCES users(id)
// );

// -- users table
// CREATE TABLE IF NOT EXISTS users (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     uid TEXT NOT NULL UNIQUE,
//     created_at TEXT DEFAULT CURRENT_TIMESTAMP,
//     updated_at TEXT DEFAULT CURRENT_TIMESTAMP
// );

// -- points table
// CREATE TABLE IF NOT EXISTS points (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     user_id INTEGER NOT NULL,
//     shop_id INTEGER NOT NULL,
//     point INTEGER NOT NULL,
//     created_at TEXT DEFAULT CURRENT_TIMESTAMP,
//     updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
//     FOREIGN KEY (user_id) REFERENCES users(id),
//     FOREIGN KEY (shop_id) REFERENCES shops(id)
// );


// app.js

const express = require('express');
const sqlite = require('better-sqlite3');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const port = 8000;
const db = new sqlite('app8.db');

// Load and run SQL file
const initSQL = fs.readFileSync('init.sql', 'utf8');
db.exec(initSQL);

// Hashing function for UID
const hashUid = (uid) => crypto.createHash('sha256').update(uid).digest('hex');

// Init endpoint to reset and re-create tables
app.post('/api/init', (req, res) => {
    try {
        console.log(req.body);
        db.exec(`DROP TABLE IF EXISTS shops, shops_users, users, points`);
        db.exec(initSQL); // Re-run the SQL commands from the init.sql file
        res.status(200).send("Tables initialized");
    } catch (error) {
        res.status(500).send("Error initializing tables");
    }
});

// Insert sample data
app.post('/api/all_sample_insert', (req, res) => {
    try {
        console.log(req.body);
        const insertShops = db.prepare(`INSERT INTO shops (shop_name) VALUES ('Sample Shop')`);
        const insertUsers = db.prepare(`INSERT INTO users (uid) VALUES ('${hashUid('user1')}')`);
        insertShops.run();
        insertUsers.run();
        res.status(200).send("Sample data inserted");
    } catch (error) {
        res.status(500).send("Error inserting sample data");
    }
});

// Read all data
app.get('/api/read_all', (req, res) => {
    try {
        console.log(req.body);
        const allData = db.prepare(`SELECT * FROM shops`).all();
        res.status(200).json(allData);
    } catch (error) {
        res.status(500).send("Error reading data");
    }
});

// Create a new shop
app.post('/api/shops_create', (req, res) => {
    try {
        console.log(req.body);
        const { shop_name } = req.body;
        if (!shop_name || shop_name.length < 1 || shop_name.length > 30) throw new Error('Invalid shop name');
        db.prepare(`INSERT INTO shops (shop_name) VALUES (?)`).run(shop_name);
        res.status(201).send("Shop created");
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Create a shop-user relation
app.post('/api/shops_users_create', (req, res) => {
    try {
        console.log(req.body);
        const { shop_id, uid } = req.body;
        const user = db.prepare(`SELECT id FROM users WHERE uid = ?`).get(hashUid(uid));
        if (!user) throw new Error("User not found");
        db.prepare(`INSERT INTO shops_users (shop_id, user_id) VALUES (?, ?)`).run(shop_id, user.id);
        res.status(201).send("Shop-User relation created");
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Create a new user
app.post('/api/users_create', (req, res) => {
    try {
        console.log(req.body);
        const { uid } = req.body;
        db.prepare(`INSERT INTO users (uid) VALUES (?)`).run(hashUid(uid));
        res.status(201).send("User created");
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Upsert user
app.post('/api/users_upsert', (req, res) => {
    try {
        console.log(req.body);
        const { uid } = req.body;
        db.prepare(`
            INSERT INTO users (uid) VALUES (?)
            ON CONFLICT(uid) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
        `).run(hashUid(uid));
        res.status(200).send("User upserted");
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Create points
app.post('/api/points_create', (req, res) => {
    try {
        console.log(req.body);
        const { shop_id, uid, point } = req.body;
        if (!Number.isInteger(point)) throw new Error('Invalid point value');
        const user = db.prepare(`SELECT id FROM users WHERE uid = ?`).get(hashUid(uid));
        if (!user) throw new Error("User not found");
        db.prepare(`INSERT INTO points (shop_id, user_id, point) VALUES (?, ?, ?)`).run(shop_id, user.id, point);
        res.status(201).send("Points created");
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Upsert points
app.post('/api/points_upsert', (req, res) => {
    try {
        console.log(req.body);
        const { shop_id, uid, point } = req.body;
        if (!Number.isInteger(point)) throw new Error('Invalid point value');
        const user = db.prepare(`SELECT id FROM users WHERE uid = ?`).get(hashUid(uid));
        if (!user) throw new Error("User not found");
        db.prepare(`
            INSERT INTO points (shop_id, user_id, point) VALUES (?, ?, ?)
            ON CONFLICT(shop_id, user_id) DO UPDATE SET point = ?, updated_at = CURRENT_TIMESTAMP
        `).run(shop_id, user.id, point, point);
        res.status(200).send("Points upserted");
    } catch (error) {
        res.status(400).send(error.message);
    }
});

app.listen(port, "0.0.0.0", () => {
    console.log(`App listening at http://localhost:${port}`);
});
