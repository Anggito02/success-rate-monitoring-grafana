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
app.use(express.json());

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

// ==== Database Connection Test ====
async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully!');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Port: ${process.env.DB_PORT}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   User: ${process.env.DB_USER}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// ==== Routes ====
// Serve index.html at root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to check database status
app.get('/api/db-status', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json({ status: 'connected', message: 'Database connection successful' });
  } catch (error) {
    res.status(500).json({ status: 'disconnected', message: error.message });
  }
});

// ==== Start Server ====
(async () => {
  try {
    // Test database connection before starting server
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected) {
      console.warn('⚠️  Server starting without database connection...');
    }
    
    app.listen(port, () => {
      console.log(`\n🚀 Server running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Gagal menjalankan migrasi atau start server:', err);
    process.exit(1);
  }
})();

// Export pool for use in other modules
module.exports = { pool };
