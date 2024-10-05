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

// ------------------ Contents CRUD ------------------

// Create Content
app.post('/contents/create', (req, res) => {
  try {
    console.log(req.body);
    const { uid, content } = req.body;

    if (!uid || !content || content.length < 1 || content.length > 1000) {
      return res.status(400).json({ error: 'Invalid content or uid.' });
    }

    const userId = db.prepare('SELECT id FROM users WHERE uid = ?').get(hashUid(uid));
    if (!userId) return res.status(404).json({ error: 'User not found.' });

    db.prepare(`
      INSERT INTO contents (user_id, content, created_at, updated_at) 
      VALUES (?, ?, datetime('now'), datetime('now'))
    `).run(userId.id, content);

    res.json({ message: 'Content created successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create content.' });
  }
});

// Update Content
app.post('/contents/update', (req, res) => {
  try {
    console.log(req.body);
    const { uid, content, contentId } = req.body;

    if (!uid || !contentId || !content || content.length < 1 || content.length > 1000) {
      return res.status(400).json({ error: 'Invalid content or uid.' });
    }

    const userId = db.prepare('SELECT id FROM users WHERE uid = ?').get(hashUid(uid));
    if (!userId) return res.status(404).json({ error: 'User not found.' });

    const result = db.prepare(`
      UPDATE contents SET content = ?, updated_at = datetime('now') 
      WHERE id = ? AND user_id = ?
    `).run(content, contentId, userId.id);

    if (result.changes === 0) return res.status(404).json({ error: 'Content not found or unauthorized.' });
    
    res.json({ message: 'Content updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update content.' });
  }
});

// Delete Content
app.post('/contents/delete', (req, res) => {
  try {
    console.log(req.body);
    const { uid, contentId } = req.body;

    if (!uid || !contentId) return res.status(400).json({ error: 'UID and contentId are required.' });

    const userId = db.prepare('SELECT id FROM users WHERE uid = ?').get(hashUid(uid));
    if (!userId) return res.status(404).json({ error: 'User not found.' });

    const result = db.prepare(`
      DELETE FROM contents WHERE id = ? AND user_id = ?
    `).run(contentId, userId.id);

    if (result.changes === 0) return res.status(404).json({ error: 'Content not found or unauthorized.' });

    res.json({ message: 'Content deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete content.' });
  }
});

// ------------------ Tags CRUD ------------------

// Create Tag
app.post('/tags/create', (req, res) => {
  try {
    console.log(req.body);
    const { tagName } = req.body;

    if (!tagName || tagName.length < 1 || tagName.length > 10) {
      return res.status(400).json({ error: 'Invalid tag name.' });
    }

    db.prepare(`
      INSERT INTO tags (tag_name, created_at, updated_at) 
      VALUES (?, datetime('now'), datetime('now'))
    `).run(tagName);

    res.json({ message: 'Tag created successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create tag.' });
  }
});

// Update Tag
app.post('/tags/update', (req, res) => {
  try {
    console.log(req.body);
    const { tagId, tagName } = req.body;

    if (!tagId || !tagName || tagName.length < 1 || tagName.length > 10) {
      return res.status(400).json({ error: 'Invalid tag name or tagId.' });
    }

    const result = db.prepare(`
      UPDATE tags SET tag_name = ?, updated_at = datetime('now') 
      WHERE id = ?
    `).run(tagName, tagId);

    if (result.changes === 0) return res.status(404).json({ error: 'Tag not found.' });
    
    res.json({ message: 'Tag updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update tag.' });
  }
});

// Delete Tag
app.post('/tags/delete', (req, res) => {
  try {
    console.log(req.body);
    const { tagId } = req.body;

    if (!tagId) return res.status(400).json({ error: 'Tag ID is required.' });

    const result = db.prepare(`
      DELETE FROM tags WHERE id = ?
    `).run(tagId);

    if (result.changes === 0) return res.status(404).json({ error: 'Tag not found.' });

    res.json({ message: 'Tag deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete tag.' });
  }
});

// ------------------ Likes CRUD ------------------

// Create Like
app.post('/likes/create', (req, res) => {
  try {
    console.log(req.body);
    const { uid, contentId } = req.body;

    if (!uid || !contentId) return res.status(400).json({ error: 'Invalid UID or contentId.' });

    const userId = db.prepare('SELECT id FROM users WHERE uid = ?').get(hashUid(uid));
    if (!userId) return res.status(404).json({ error: 'User not found.' });

    db.prepare(`
      INSERT INTO likes (user_id, content_id, created_at, updated_at) 
      VALUES (?, ?, datetime('now'), datetime('now'))
    `).run(userId.id, contentId);

    res.json({ message: 'Like created successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create like.' });
  }
});

// Delete Like
app.post('/likes/delete', (req, res) => {
  try {
    console.log(req.body);
    const { uid, contentId } = req.body;

    if (!uid || !contentId) return res.status(400).json({ error: 'Invalid UID or contentId.' });

    const userId = db.prepare('SELECT id FROM users WHERE uid = ?').get(hashUid(uid));
    if (!userId) return res.status(404).json({ error: 'User not found.' });

    const result = db.prepare(`
      DELETE FROM likes WHERE user_id = ? AND content_id = ?
    `).run(userId.id, contentId);

    if (result.changes === 0) return res.status(404).json({ error: 'Like not found.' });

    res.json({ message: 'Like deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete like.' });
  }
});

// ------------------ Bookmarks CRUD ------------------

// Create Bookmark
app.post('/bookmarks/create', (req, res) => {
  try {
    console.log(req.body);
    const { uid, contentId } = req.body;

    if (!uid || !contentId) return res.status(400).json({ error: 'Invalid UID or contentId.' });

    const userId = db.prepare('SELECT id FROM users WHERE uid = ?').get(hashUid(uid));
    if (!userId) return res.status(404).json({ error: 'User not found.' });

    db.prepare(`
      INSERT INTO bookmarks (user_id, content_id, created_at, updated_at) 
      VALUES (?, ?, datetime('now'), datetime('now'))
    `).run(userId.id, contentId);

    res.json({ message: 'Bookmark created successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create bookmark.' });
  }
});

// Delete Bookmark
app.post('/bookmarks/delete', (req, res) => {
  try {
    console.log(req.body);
    const { uid, contentId } = req.body;

    if (!uid || !contentId) return res.status(400).json({ error: 'Invalid UID or contentId.' });

    const userId = db.prepare('SELECT id FROM users WHERE uid = ?').get(hashUid(uid));
    if (!userId) return res.status(404).json({ error: 'User not found.' });

    const result = db.prepare(`
      DELETE FROM bookmarks WHERE user_id = ? AND content_id = ?
    `).run(userId.id, contentId);

    if (result.changes === 0) return res.status(404).json({ error: 'Bookmark not found.' });

    res.json({ message: 'Bookmark deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete bookmark.' });
  }
});

