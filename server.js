// server.js

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { nanoid } = require('nanoid');
const path = require('path');
const app = express();
require('dotenv').config();
app.use(express.json());
app.use(express.static('public'));



// Twilio variables
const twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const twilioClient = twilio(accountSid, authToken);
const db = new sqlite3.Database('mydev.db');

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Promisify database operations for cleaner async/await
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Create tables
async function initializeTables() {
  try {
    await dbRun(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS forms_status (
        token TEXT PRIMARY KEY,
        client_id INTEGER NOT NULL,
        purchase_agreement BOOLEAN DEFAULT 0,
        medical_history BOOLEAN DEFAULT 0,
        informed_consent BOOLEAN DEFAULT 0,
        privacy_practices BOOLEAN DEFAULT 0,
        skin_type_assessment BOOLEAN DEFAULT 0,
        media_release BOOLEAN DEFAULT 0,
        sent BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS form_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        form_type TEXT NOT NULL,
        data TEXT NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
      )
    `);

    console.log('Tables initialized successfully');
  } catch (err) {
    console.error('Error initializing tables:', err);
    throw err;
  }
}

// Seed database with sample data
async function seedDatabase() {
  try {
    console.log('Seeding database...');

    // Sample clients
    const clients = [
      { first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com', phone: '555-0101' },
      { first_name: 'Jane', last_name: 'Smith', email: 'jane.smith@example.com', phone: '555-0102' },
      { first_name: 'Michael', last_name: 'Johnson', email: 'michael.j@example.com', phone: '555-0103' },
      { first_name: 'Emily', last_name: 'Davis', email: 'emily.davis@example.com', phone: '555-0104' },
      { first_name: 'Robert', last_name: 'Wilson', email: 'robert.w@example.com', phone: '555-0105' }
    ];

    for (const client of clients) {
      const result = await dbRun(
        `INSERT INTO clients (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)`,
        [client.first_name, client.last_name, client.email, client.phone]
      );

      const clientId = result.lastID;
      const token = nanoid(15);

      await dbRun(
        `INSERT INTO forms_status (token, client_id, purchase_agreement, medical_history, informed_consent, media_release, privacy_practices, skin_type_assessment, sent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [token, clientId, 0, 0, 0, 0, 0, 0, 0]
      );

      console.log(`Created client: ${client.first_name} ${client.last_name} (token: ${token})`);
    }

    console.log('Database seeded successfully');
  } catch (err) {
    console.error('Error seeding database:', err);
    throw err;
  }
}

// Reset database
async function resetDatabase() {
  try {
    console.log('Resetting database...');
    
    // Disable foreign keys temporarily
    await dbRun('PRAGMA foreign_keys = OFF');
    
    // Drop all tables
    await dbRun('DROP TABLE IF EXISTS form_submissions');
    await dbRun('DROP TABLE IF EXISTS forms_status');
    await dbRun('DROP TABLE IF EXISTS clients');
    
    console.log('Tables dropped');
    
    // Re-enable foreign keys
    await dbRun('PRAGMA foreign_keys = ON');
    
    await initializeTables();
    await seedDatabase();
    
    console.log('Database reset complete');
  } catch (err) {
    console.error('Error resetting database:', err);
    throw err;
  }
}

// Initialize database on startup
(async () => {
  try {
    const reset = process.argv.includes('--reset') || process.env.RESET_DB === 'true';
    
    if (reset) {
      await resetDatabase();
    } else {
      await initializeTables();
      
      // Check if database is empty and seed if needed
      const clientCount = await dbGet('SELECT COUNT(*) as count FROM clients');
      if (clientCount.count === 0) {
        console.log('Database is empty, seeding...');
        await seedDatabase();
      }
    }
  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  }
})();

// ===================== API ENDPOINTS =====================

// Form label mapping
const FORM_LABELS = {
  purchase_agreement: 'Purchase Agreement',
  medical_history: 'Medical History',
  skin_type_assessment: 'Skin Type Assessment',
  informed_consent: 'Informed Consent',
  privacy_practices: 'Privacy Practices',
  media_release: 'Media Release'
};

// Send a single form to client
app.post('/send-single-form', async (req, res) => {
  const { clientId, formType, token } = req.body;

  if (!clientId || !formType || !token) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields' 
    });
  }

  try {
    // Get client information
    const client = await dbGet('SELECT * FROM clients WHERE id = ?', [clientId]);
    
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client not found' 
      });
    }

    if (!client.phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Client has no phone number' 
      });
    }

    // Create the form URL with the specific form type
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const formUrl = `${baseUrl}/form-wizard/${token}?form=${formType}`;
    
    const formLabel = FORM_LABELS[formType] || formType;
    
    // Create SMS message
    const smsMessage = `Hi ${client.first_name},\n\nPlease complete your ${formLabel} using this secure link:\n\n${formUrl}\n\nThank you!\n- Uptown Laser`;
    
    // Send SMS via Twilio
    await twilioClient.messages.create({
      body: smsMessage,
      from: twilioPhone,
      to: client.phone
    });
    
    console.log(`Sent ${formLabel} to ${client.first_name} ${client.last_name} at ${client.phone}`);
    
    res.json({ 
      success: true,
      message: `${formLabel} sent successfully`,
      sentTo: client.phone,
      url: formUrl
    });

  } catch (error) {
    console.error('Error sending single form:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Twilio send forms link (send all forms)
app.post('/send-forms', async (req, res) => {
  const { clientName, phone, url } = req.body;

  if (!phone) {
    return res.status(400).json({ 
      success: false, 
      message: 'Phone number is required' 
    });
  }

  try {
    const smsMessage = `Hi ${clientName},\n\nPlease complete your forms using this secure link:\n\n${url}\n\nThank you!`;
    
    await twilioClient.messages.create({
      body: smsMessage,
      from: twilioPhone,
      to: phone
    });
    
    res.json({ 
      success: true,
      message: smsMessage
    });

  } catch (error) {
    console.error('SMS Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});


// Get all clients
app.get('/clients', async (req, res) => {
  try {
    const clients = await dbAll('SELECT * FROM clients ORDER BY last_name, first_name');
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single client by ID
app.get('/clients/:id', async (req, res) => {
  try {
    const client = await dbGet('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new client with forms_status
app.post('/clients', async (req, res) => {
  const { first_name, last_name, email, phone } = req.body;

  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }

  try {
    const result = await dbRun(
      'INSERT INTO clients (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)',
      [first_name, last_name, email, phone]
    );

    const clientId = result.lastID;
    const token = nanoid(15);

    await dbRun(
      `INSERT INTO forms_status (token, client_id, purchase_agreement, medical_history, informed_consent, privacy_practices, skin_type_assessment, media_release)
       VALUES (?, ?, 0, 0, 0, 0, 0, 0)`,
      [token, clientId]
    );

    res.json({ id: clientId, token, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(err)
    console.log("Something wrong.")
  }
});

// Update client information
app.patch('/clients/:id', async (req, res) => {
  const { first_name, last_name, email, phone } = req.body;
  const updates = [];
  const values = [];

  if (first_name) { updates.push('first_name = ?'); values.push(first_name); }
  if (last_name) { updates.push('last_name = ?'); values.push(last_name); }
  if (email !== undefined) { updates.push('email = ?'); values.push(email); }
  if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(req.params.id);

  try {
    const result = await dbRun(
      `UPDATE clients SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete client
app.delete('/clients/:id', async (req, res) => {
  try {
    const result = await dbRun('DELETE FROM clients WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get forms_status for a client
app.get('/forms/:client_id', async (req, res) => {
  try {
    const forms = await dbAll('SELECT * FROM forms_status WHERE client_id = ?', [req.params.client_id]);
    res.json(forms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a form boolean field
app.patch('/forms/update/:token', async (req, res) => {
  const { token } = req.params;
  const { field, value } = req.body;
  const validFields = ['purchase_agreement', 'medical_history', 'informed_consent', 'privacy_practices', 'skin_type_assessment', 'media_release', 'sent'];

  if (!validFields.includes(field)) {
    return res.status(400).json({ error: 'Invalid field name' });
  }

  try {
    const result = await dbRun(
      `UPDATE forms_status SET ${field} = ?, updated_at = CURRENT_TIMESTAMP WHERE token = ?`,
      [value ? 1 : 0, token]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Client view by token (for form wizard)
app.get('/client/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const form = await dbGet('SELECT * FROM forms_status WHERE token = ?', [token]);
    
    if (!form) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    const client = await dbGet('SELECT * FROM clients WHERE id = ?', [form.client_id]);
    
    res.json({ client, form });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Form wizard page
app.get('/form-wizard/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'form-wizard.html'));
});

// Submit form
app.post('/submit-form/:token', async (req, res) => {
  const { token } = req.params;
  const { formType, data } = req.body;

  if (!formType || !data) {
    return res.status(400).json({ error: 'Missing form type or data' });
  }

  try {
    const form = await dbGet('SELECT client_id FROM forms_status WHERE token = ?', [token]);
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const result = await dbRun(
      `INSERT INTO form_submissions (client_id, form_type, data) VALUES (?, ?, ?)`,
      [form.client_id, formType, JSON.stringify(data)]
    );

    res.json({ success: true, submissionId: result.lastID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all form submissions for a client
app.get('/client-forms/:clientId', async (req, res) => {
  const { clientId } = req.params;

  try {
    const submissions = await dbAll(
      'SELECT id, form_type, data, submitted_at FROM form_submissions WHERE client_id = ? ORDER BY submitted_at DESC',
      [clientId]
    );

    // Parse JSON data for easier consumption
    const parsed = submissions.map(sub => ({
      ...sub,
      data: JSON.parse(sub.data)
    }));

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single form submission
app.get('/submissions/:id', async (req, res) => {
  try {
    const submission = await dbGet('SELECT * FROM form_submissions WHERE id = ?', [req.params.id]);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    submission.data = JSON.parse(submission.data);
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manual database reset endpoint (for development only)
app.post('/admin/reset-database', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not allowed in production' });
  }

  try {
    await resetDatabase();
    res.json({ success: true, message: 'Database reset complete' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard: all form submissions with client + sent status
app.get('/api/forms', async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT 
        c.first_name || ' ' || c.last_name AS name,
        fs.sent AS sent,
        s.form_type AS form_type,
        s.data AS data
      FROM form_submissions s
      JOIN clients c ON c.id = s.client_id
      JOIN forms_status fs ON fs.client_id = c.id
      ORDER BY s.submitted_at DESC
    `);

    // Parse JSON
    const parsed = rows.map(r => ({
      ...r,
      data: JSON.parse(r.data)
    }));

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FORM MANAGEMENT ENDPOINTS
app.get('/api/all-submissions', async (req, res) => {
  try {
    const submissions = await dbAll(`
      SELECT 
        s.*,
        c.first_name,
        c.last_name,
        c.email,
        c.phone
      FROM form_submissions s
      JOIN clients c ON c.id = s.client_id
      ORDER BY s.submitted_at DESC
    `);

    const parsed = submissions.map(sub => ({
      ...sub,
      data: JSON.parse(sub.data)
    }));

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a form submission
app.patch('/submissions/:id', async (req, res) => {
  const { id } = req.params;
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ error: 'No data provided' });
  }

  try {
    const result = await dbRun(
      `UPDATE form_submissions SET data = ?, submitted_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [JSON.stringify(data), id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get clients with forms status (optimized for form management page)
app.get('/api/clients-with-forms', async (req, res) => {
  try {
    const clients = await dbAll(`
      SELECT 
        c.*,
        fs.purchase_agreement,
        fs.medical_history,
        fs.skin_type_assessment,
        fs.informed_consent,
        fs.privacy_practices,
        fs.media_release,
        fs.sent,
        fs.token
      FROM clients c
      LEFT JOIN forms_status fs ON fs.client_id = c.id
      ORDER BY c.last_name, c.first_name
    `);

    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Run raw SQL (only SELECT for safety) - for debugging
app.post('/sql', async (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'No query provided' });
  }

  if (!query.trim().toUpperCase().startsWith('SELECT')) {
    return res.status(400).json({ error: 'Only SELECT queries allowed' });
  }

  try {
    const rows = await dbAll(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});