require('dotenv').config();

const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

const app = express();
const port = 3000;

// ==== Middleware ====
app.use(express.static('public'));

// ==== Routes ====
// Serve index.html at root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==== MySQL Connection Pool ====
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ==== Start Server ====
(async () => {
  try {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Gagal menjalankan migrasi atau start server:', err);
    process.exit(1);
  }
})();
