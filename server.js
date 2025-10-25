const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { nanoid } = require('nanoid');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database('mydev.db');

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Create tables
db.serialize(() => {
    db.run('DROP TABLE IF EXISTS forms'); // delete old table
  db.run('DROP TABLE IF EXISTS clients'); // delete old table
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      phone TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS forms (
      token TEXT PRIMARY KEY,
      client_id INTEGER,
      informed_consent BOOLEAN DEFAULT 0,
      medical_history BOOLEAN DEFAULT 0,
      privacy_practices_notices BOOLEAN DEFAULT 0,
      e_sign_consent BOOLEAN DEFAULT 0,
      sent INTEGER DEFAULT 0,
      FOREIGN KEY(client_id) REFERENCES clients(id)
    )
  `);
});

// Get all clients
app.get('/clients', (req, res) => {
  db.all("SELECT * FROM clients", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a new client + default form
app.post('/clients', (req, res) => {
  const { first_name, last_name, email, phone } = req.body;
  db.run(
    "INSERT INTO clients (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)",
    [first_name, last_name, email, phone],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      const clientId = this.lastID;
      const token = nanoid(8);

      db.run(
        `INSERT INTO forms (token, client_id, informed_consent, medical_history, privacy_practices_notices, e_sign_consent)
         VALUES (?, ?, 0, 0, 0, 0)`,
        [token, clientId],
        function(err2) {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ id: clientId, token });
        }
      );
    }
  );
});

// Get forms for a client
app.get('/forms/:client_id', (req, res) => {
  db.all("SELECT * FROM forms WHERE client_id = ?", [req.params.client_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Update a form boolean field
app.patch('/forms/update/:token', (req, res) => {
  const token = req.params.token;
  const { field, value } = req.body;
  const validFields = ['informed_consent', 'medical_history', 'privacy_practices_notices', 'e_sign_consent'];

  if (!validFields.includes(field)) return res.status(400).json({ error: 'Invalid field name' });

  const sql = `UPDATE forms SET ${field} = ? WHERE token = ?`;
  db.run(sql, [value ? 1 : 0, token], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Form not found' });
    res.json({ success: true });
  });
});

// Client view by token
app.get('/client/:token', (req, res) => {
  const token = req.params.token;
  db.get("SELECT * FROM forms WHERE token = ?", [token], (err, form) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!form) return res.status(404).json({ error: 'Invalid token' });

    db.get("SELECT * FROM clients WHERE id = ?", [form.client_id], (err2, client) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ client, form });
    });
  });
});

// Run raw SQL (only SELECT for safety)
app.post('/sql', (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'No query provided' });

  if (!query.trim().toUpperCase().startsWith('SELECT')) {
    return res.status(400).json({ error: 'Only SELECT queries allowed' });
  }

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
