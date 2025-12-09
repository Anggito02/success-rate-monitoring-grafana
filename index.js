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

// API endpoint to get list of applications
app.get('/api/applications', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT app_name FROM app_identifier');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching applications:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// API endpoint to restart database (drop and recreate schema)
app.post('/api/restart-db', async (req, res) => {
    try {
        const connection = await pool.getConnection();

        // Disable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // Get all tables in the current database
        const [tables] = await connection.query('SHOW TABLES');

        // Drop each table
        for (const row of tables) {
            const tableName = Object.values(row)[0];
            await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
        }

        // Re-enable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        // Create app_identifier table
        await connection.execute(`
      CREATE TABLE app_identifier (
        id INT AUTO_INCREMENT PRIMARY KEY,
        app_name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

        // Create app_success_rate table
        await connection.execute(`
      CREATE TABLE app_success_rate (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tanggal_transaksi DATE,
        bulan VARCHAR(20),
        tahun INT,
        jenis_transaksi VARCHAR(255),
        rc VARCHAR(50),
        rc_description VARCHAR(500),
        total_transaksi INT,
        total_nominal DECIMAL(20, 2),
        total_biaya_admin DECIMAL(20, 2),
        status_transaksi ENUM('sukses', 'failed', 'pending'),
        error_type ENUM('S', 'N'),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

        // Create response_code_dictionary table
        await connection.execute(`
      CREATE TABLE response_code_dictionary (
        id INT AUTO_INCREMENT PRIMARY KEY,
        jenis_transaksi VARCHAR(255) NOT NULL,
        rc VARCHAR(50),
        error_type ENUM('S', 'N') NOT NULL
      )
    `);

        connection.release();

        console.log('✅ Database schema restarted successfully!');
        res.json({
            success: true,
            message: 'Database schema restarted successfully. Tables created: app_identifier, app_success_rate, response_code_dictionary'
        });
    } catch (error) {
        console.error('Error restarting database:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// API endpoint to add new application
app.post('/api/applications', async (req, res) => {
    try {
        const { appName } = req.body;

        if (!appName || !appName.trim()) {
            return res.status(400).json({ success: false, message: 'Application name is required' });
        }

        const [result] = await pool.execute(
            'INSERT INTO app_identifier (app_name) VALUES (?)',
            [appName.trim()]
        );

        res.json({
            success: true,
            message: 'Application added successfully',
            data: { id: result.insertId, appName: appName.trim() }
        });
    } catch (error) {
        console.error('Error adding application:', error.message);

        // Check for duplicate entry
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Application name already exists' });
        }

        res.status(500).json({ success: false, message: error.message });
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
