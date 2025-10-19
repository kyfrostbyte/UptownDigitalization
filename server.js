const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { nanoid } = require('nanoid'); // generate unique tokens
const app = express();

app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database('mydev.db');

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    token TEXT UNIQUE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    name TEXT,
    sent INTEGER DEFAULT 0,
    FOREIGN KEY(client_id) REFERENCES clients(id)
  )`);
});

// Get all clients
app.get('/clients', (req, res) => {
  db.all("SELECT * FROM clients", [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

// Add a client
app.post('/clients', (req, res) => {
  const { first_name, last_name, email, phone } = req.body;
  const token = nanoid(8); // generate short unique token
  db.run(
    "INSERT INTO clients (first_name, last_name, email, phone, token) VALUES (?, ?, ?, ?, ?)",
    [first_name, last_name, email, phone, token],
    function(err) {
      if (err) return res.status(500).send(err.message);
      res.json({ id: this.lastID, token });
    }
  );
});

// Get forms for a client
app.get('/forms/:client_id', (req, res) => {
  db.all("SELECT * FROM forms WHERE client_id = ?", [req.params.client_id], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

// Add form(s) to a client
app.post('/forms/:client_id', (req, res) => {
  const { names } = req.body; // array of form names
  const client_id = req.params.client_id;
  const stmt = db.prepare("INSERT INTO forms (client_id, name, sent) VALUES (?, ?, 1)");
  names.forEach(name => stmt.run(client_id, name));
  stmt.finalize();
  res.json({ success: true });
});

// Client view by token
app.get('/client/:token', (req, res) => {
  const token = req.params.token;
  db.get("SELECT * FROM clients WHERE token = ?", [token], (err, client) => {
    if (err) return res.status(500).send(err.message);
    if (!client) return res.status(404).send("Invalid token");

    db.all("SELECT * FROM forms WHERE client_id = ?", [client.id], (err, forms) => {
      if (err) return res.status(500).send(err.message);
      res.json({ client, forms });
    });
  });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
