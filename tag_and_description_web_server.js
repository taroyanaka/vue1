const express = require('express');
const sqlite = require('better-sqlite3');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const db = new sqlite('app8.db');
const port = 8000;

const hashUid = (uid) => crypto.createHash('sha256').update(uid).digest('hex');

// エラーハンドリング付きの初期化エンドポイント
app.post('/init', (req, res) => {
  try {
    console.log(req.body);
    db.exec(`
      PRAGMA foreign_keys = ON;
      DROP TABLE IF EXISTS bookmarks;
      DROP TABLE IF EXISTS emails;
      DROP TABLE IF EXISTS likes;
      DROP TABLE IF EXISTS contents_tags;
      DROP TABLE IF EXISTS tags;
      DROP TABLE IF EXISTS contents;
      DROP TABLE IF EXISTS users;

      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE contents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL CHECK(length(content) >= 1 AND length(content) <= 1000),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
      );

      CREATE TABLE tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tag_name TEXT NOT NULL UNIQUE CHECK(length(tag_name) >= 1 AND length(tag_name) <= 10),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE contents_tags (
        content_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (content_id, tag_id),
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE ON UPDATE CASCADE
      );

      CREATE TABLE likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content_id INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE ON UPDATE CASCADE
      );

      CREATE TABLE emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content_id INTEGER NOT NULL,
        email TEXT NOT NULL CHECK(length(email) >= 1),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE ON UPDATE CASCADE
      );

      CREATE TABLE bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content_id INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    res.json({ message: 'Database initialized.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Initialization failed.' });
  }
});

// サンプルデータ挿入エンドポイント
app.post('/insert_sample', (req, res) => {
  try {
    console.log(req.body);
    const insertUser = db.prepare(`
      INSERT INTO users (uid, created_at, updated_at) 
      VALUES (?, datetime('now'), datetime('now'))
    `);
    insertUser.run('sampleuid1');
    insertUser.run('sampleuid2');

    const insertContent = db.prepare(`
      INSERT INTO contents (user_id, content, created_at, updated_at) 
      VALUES (?, ?, datetime('now'), datetime('now'))
    `);
    insertContent.run(1, 'これはサンプル記事です。');
    insertContent.run(2, 'もう一つのサンプル記事です。');

    const insertTag = db.prepare(`
      INSERT INTO tags (tag_name, created_at, updated_at) 
      VALUES (?, datetime('now'), datetime('now'))
    `);
    insertTag.run('sample');
    insertTag.run('test');

    res.json({ message: 'Sample data inserted.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sample data insertion failed.' });
  }
});

// get_allエンドポイント: 全てのデータをツリー構造で取得
app.get('/get_all', (req, res) => {
  try {
    console.log(req.query);
    const users = db.prepare(`
      SELECT * FROM users
    `).all();

    const contents = db.prepare(`
      SELECT * FROM contents
    `).all();

    const tags = db.prepare(`
      SELECT * FROM tags
    `).all();

    res.json({ users, contents, tags });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data.' });
  }
});

// サーバー起動
app.listen(port, "0.0.0.0", () => {
  console.log(`App listening at http://localhost:${port}`);
});
