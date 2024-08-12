// Initialize SQLite database
const db_for_lexis = new sqlite('lexis.db');

// Function to initialize the database table
const initializeDatabase_lexis = () => {
    db_for_lexis.exec('DROP TABLE IF EXISTS lexis');
    db_for_lexis.exec(`
        CREATE TABLE lexis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lexis TEXT NOT NULL,
            uid TEXT NOT NULL,
            created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
};

// Endpoint to initialize the database table
app.post('/api/init-database-lexis', (req, res) => {
    const { password } = req.body;

    if (password === 'init') {
        try {
            initializeDatabase_lexis();
            res.status(200).json({ message: 'Database initialized successfully.' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to initialize database.' });
        }
    } else {
        res.status(403).json({ error: 'Unauthorized: Invalid password.' });
    }
});

app.post('/api/lexis', (req, res) => {
    const { id, lexis, uid } = req.body;

    // 入力の検証
    if (typeof lexis !== 'string' || 
        typeof uid !== 'string' || 
        lexis.length < 1 || lexis.length > 3000) {
        return res.status(400).json({ error: 'Invalid input. "lexis" must be a valid string with length between 1 and 3000 characters.' });
    }

    // 提供された ID が既に存在するかを確認
    const existingId = db_for_lexis.prepare('SELECT id FROM lexis WHERE id = ?').get(id);

    if (existingId) {
        // ID が既に存在する場合はレスポンスを返して終了
        res.status(200).json({ message: 'ID already exists. No action taken.' });
        return res.end();
    } else if (id === null || id === undefined) {
        // ID が提供されていない、または存在しない場合は新しいレコードを挿入
        const stmt = db_for_lexis.prepare('INSERT INTO lexis (lexis, uid) VALUES (?, ?)');
        const result = stmt.run(lexis, uid);

        // レスポンスを返す
        return res.status(201).json({
            lexis,
            uid,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        });
    }
});

// Endpoint to fetch all lexis records or specific user's records
app.get('/api/lexis', (req, res) => {
    try {
        const stmt = db_for_lexis.prepare('SELECT * FROM lexis');
        const rows = stmt.all();
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve records.' });
    }
});


// Endpoint to delete a specific lexis record
app.post('/api/lexis/delete', (req, res) => {
    const { id, uid } = req.body;

    console.log('Received id:', id, 'and uid:', uid); // デバッグ用ログ

    if (typeof id !== 'number' || typeof uid !== 'string') {
        return res.status(400).json({ error: 'Invalid input.' });
    }

    const stmt = db_for_lexis.prepare('DELETE FROM lexis WHERE id = ? AND uid = ?');
    const result = stmt.run(id, uid);

    if (result.changes > 0) {
        res.status(200).json({ message: 'Record deleted successfully.' });
    } else {
        res.status(404).json({ error: 'Record not found.' });
    }
});
