import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

function getPool() {
  if (!pool) {
    // Parse DATABASE_URL: mysql://user:pass@host:port/database
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const url = new URL(dbUrl);
    const config = {
      host: url.hostname,
      user: url.username,
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1), // Remove leading slash
      port: parseInt(url.port || '3306', 10),
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    };

    pool = mysql.createPool(config);
  }
  return pool;
}

export async function query(sql: string, values?: any[]) {
  const connection = await getPool().getConnection();
  try {
    const [results] = await connection.execute(sql, values || []);
    return results;
  } finally {
    connection.release();
  }
}

export async function queryOne(sql: string, values?: any[]) {
  const results = await query(sql, values);
  return Array.isArray(results) && results.length > 0 ? results[0] : null;
}

export async function initializeDatabase() {
  try {
    // Create registrations table
    await query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id VARCHAR(50) PRIMARY KEY,
        teamName VARCHAR(255),
        leaderName VARCHAR(255),
        leaderEmail VARCHAR(255),
        leaderPhone VARCHAR(20),
        participant2 VARCHAR(255),
        participant3 VARCHAR(255),
        participant4 VARCHAR(255),
        institution VARCHAR(255),
        eventName VARCHAR(255),
        eventSlug VARCHAR(100),
        transactionId VARCHAR(50),
        status VARCHAR(50),
        needsAccommodation BOOLEAN,
        isAccepted BOOLEAN,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        rawData LONGTEXT,
        INDEX idx_eventName (eventName),
        INDEX idx_status (status),
        INDEX idx_transactionId (transactionId)
      )
    `);

    // Create sync logs table
    await query(`
      CREATE TABLE IF NOT EXISTS sync_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        registrationId VARCHAR(50),
        syncedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20),
        message TEXT,
        FOREIGN KEY (registrationId) REFERENCES registrations(id) ON DELETE CASCADE
      )
    `);

    // Create coordinator access table
    await query(`
      CREATE TABLE IF NOT EXISTS coordinator_access (
        id INT AUTO_INCREMENT PRIMARY KEY,
        eventName VARCHAR(255),
        eventSlug VARCHAR(100) UNIQUE,
        accessLink VARCHAR(255),
        password VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('[DB_INIT] Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('[DB_INIT_ERROR]', error);
    throw error;
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
