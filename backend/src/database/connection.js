const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'portal_user',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'company_portal',
  connectionLimit: 10,
  acquireTimeout: 30000,
  connectTimeout: 30000,
  bigIntAsNumber: true,
  insertIdAsNumber: true
});

async function getConnection() {
  return await pool.getConnection();
}

async function query(sql, params = []) {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.query(sql, params);
    return result;
  } finally {
    if (conn) conn.release();
  }
}

async function testConnection() {
  let conn;
  try {
    conn = await getConnection();
    await conn.query('SELECT 1');
    return true;
  } finally {
    if (conn) conn.release();
  }
}

module.exports = {
  pool,
  getConnection,
  query,
  testConnection
};
