-- Enable foreign keys in SQLite
PRAGMA foreign_keys = ON;

-- 全テーブルを削除
DROP TABLE IF EXISTS bookmarks;
DROP TABLE IF EXISTS emails;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS contents_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS contents;
DROP TABLE IF EXISTS users;

-- 1. users テーブル
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2. contents テーブル
CREATE TABLE contents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. tags テーブル
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tag_name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 4. contents_tags テーブル
CREATE TABLE contents_tags (
  content_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (content_id, tag_id),
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. likes テーブル
CREATE TABLE likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 6. emails テーブル
CREATE TABLE emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 7. bookmarks テーブル
CREATE TABLE bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- サンプルデータの投入

-- ユーザーサンプル
INSERT INTO users (uid, created_at, updated_at)
VALUES ('sampleuid1', datetime('now'), datetime('now')),
       ('sampleuid2', datetime('now'), datetime('now'));

-- コンテンツサンプル
INSERT INTO contents (user_id, content, created_at, updated_at)
VALUES (1, 'これはサンプル記事です。', datetime('now'), datetime('now')),
       (2, 'もう一つのサンプル記事です。', datetime('now'), datetime('now'));

-- タグサンプル
INSERT INTO tags (tag_name, created_at, updated_at)
VALUES ('sample', datetime('now'), datetime('now')),
       ('test', datetime('now'), datetime('now'));

-- コンテンツタグのサンプル
INSERT INTO contents_tags (content_id, tag_id, created_at, updated_at)
VALUES (1, 1, datetime('now'), datetime('now')),
       (1, 2, datetime('now'), datetime('now')),
       (2, 1, datetime('now'), datetime('now'));

-- いいねサンプル
INSERT INTO likes (user_id, content_id, created_at, updated_at)
VALUES (1, 1, datetime('now'), datetime('now')),
       (2, 2, datetime('now'), datetime('now'));

-- メールサンプル
INSERT INTO emails (user_id, content_id, email, created_at, updated_at)
VALUES (1, 1, 'sample1@example.com', datetime('now'), datetime('now')),
       (2, 2, 'sample2@example.com', datetime('now'), datetime('now'));

-- ブックマークサンプル
INSERT INTO bookmarks (user_id, content_id, created_at, updated_at)
VALUES (1, 1, datetime('now'), datetime('now')),
       (2, 2, datetime('now'), datetime('now'));
