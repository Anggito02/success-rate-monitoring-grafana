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

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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
        const [rows] = await pool.execute('SELECT id, app_name FROM app_identifier ORDER BY app_name');
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

        // Insert apps
        await connection.execute(`
            INSERT INTO app_identifier(app_name)
            VALUES
                ('New MB'),
                ('CMS'),
                ('SMS Notif'),
                ('QRIS'),
                ('EDC Merchant'),
                ('EDC Agent'),
                ('Bale Korpora')
            `)

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
        error_type ENUM('S', 'N', 'Sukses'),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

        // Create response_code_dictionary table
        await connection.execute(`
      CREATE TABLE response_code_dictionary (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_app_identifier INT NOT NULL,
        jenis_transaksi VARCHAR(255),
        rc VARCHAR(50),
        error_type ENUM('S', 'N', 'Sukses') NOT NULL,
        FOREIGN KEY (id_app_identifier) REFERENCES app_identifier(id) ON DELETE CASCADE,
        UNIQUE KEY unique_dictionary_entry (id_app_identifier, jenis_transaksi, rc)
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

// API endpoint to upload dictionary file
app.post('/api/upload-dictionary', upload.single('dictionaryFile'), async (req, res) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Get application ID (required)
        const { selectedApplicationId } = req.body;

        if (!selectedApplicationId || isNaN(parseInt(selectedApplicationId))) {
            return res.status(400).json({ success: false, message: 'Valid application selection is required' });
        }

        const applicationId = parseInt(selectedApplicationId);

        // Parse Excel file
        const data = new Uint8Array(req.file.buffer);
        const workbook = xlsx.read(data, { type: 'array' });

        if (workbook.SheetNames.length === 0) {
            return res.status(400).json({ success: false, message: 'Excel file contains no worksheets' });
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Get headers from first row
        const range = xlsx.utils.decode_range(worksheet['!ref']);
        const headers = [];

        for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = xlsx.utils.encode_cell({ r: 0, c: col });
            const cell = worksheet[cellAddress];
            if (cell && cell.v) {
                headers.push(String(cell.v).trim());
            }
        }

        // Validate columns
        if (headers.length !== 3) {
            return res.status(400).json({
                success: false,
                message: `Invalid column count. Expected 3 columns, got ${headers.length}`
            });
        }

        // Check required columns (case-insensitive)
        const normalizedHeaders = headers.map(h => h.toLowerCase());
        const requiredColumns = ['jenis transaksi', 'rc', 's/n'];

        const missingColumns = requiredColumns.filter(required =>
            !normalizedHeaders.includes(required)
        );

        if (missingColumns.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required columns: ${missingColumns.join(', ')}`
            });
        }

        // Find column indices
        const jenisTransaksiIndex = normalizedHeaders.indexOf('jenis transaksi');
        const rcIndex = normalizedHeaders.indexOf('rc');
        const snIndex = normalizedHeaders.indexOf('s/n');

        // Collect data from rows (skip header row)
        const dictionaryData = [];

        for (let rowNum = 1; rowNum <= range.e.r; rowNum++) {
            const jenisTransaksiCell = worksheet[xlsx.utils.encode_cell({ r: rowNum, c: jenisTransaksiIndex })];
            const rcCell = worksheet[xlsx.utils.encode_cell({ r: rowNum, c: rcIndex })];
            const snCell = worksheet[xlsx.utils.encode_cell({ r: rowNum, c: snIndex })];

            const jenisTransaksi = jenisTransaksiCell && jenisTransaksiCell.v ? String(jenisTransaksiCell.v).trim() : '';
            const rc = rcCell && rcCell.v ? String(rcCell.v).trim() : '';
            const rawSn = snCell && snCell.v ? String(snCell.v).trim().toUpperCase() : '';

            // Map S/N values to error_type
            let errorType = null;
            if (rawSn === 'S') {
                errorType = 'S';
            } else if (rawSn === 'N') {
                errorType = 'N';
            } else if (rawSn === 'SUKSES' || rawSn === 'SUKSES' || rawSn === 'SUCCESS' || rawSn === 'BERHASIL') {
                errorType = 'Sukses';
            }

            // Validate row data - skip if missing error_type (only error_type is required now, jenis_transaksi and rc can be empty)
            if (!errorType) {
                continue; // Skip rows without valid error_type
            }

            if (errorType) {
                dictionaryData.push({
                    jenis_transaksi: jenisTransaksi,
                    rc: rc,
                    error_type: errorType
                });
            }
        }

        if (dictionaryData.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid dictionary data found in the file' });
        }

        // Insert data into database
        const connection = await pool.getConnection();
        try {
            // First, verify the application exists
            const [appResult] = await connection.execute(
                'SELECT app_name FROM app_identifier WHERE id = ?',
                [applicationId]
            );

            if (appResult.length === 0) {
                return res.status(400).json({ success: false, message: 'Selected application does not exist' });
            }

            const applicationName = appResult[0].app_name;

            // Use INSERT IGNORE or ON DUPLICATE KEY UPDATE to handle duplicates
            const insertQuery = `
                INSERT INTO response_code_dictionary (id_app_identifier, jenis_transaksi, rc, error_type)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                error_type = VALUES(error_type)
            `;

            for (const entry of dictionaryData) {
                await connection.execute(insertQuery, [
                    applicationId,
                    entry.jenis_transaksi,
                    entry.rc,
                    entry.error_type
                ]);
            }

            res.json({
                success: true,
                message: `Dictionary uploaded successfully. ${dictionaryData.length} entries processed.`,
                data: {
                    entriesProcessed: dictionaryData.length,
                    applicationId: applicationId,
                    applicationName: applicationName
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error uploading dictionary:', error);
        res.status(500).json({ success: false, message: 'Error processing dictionary file: ' + error.message });
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
