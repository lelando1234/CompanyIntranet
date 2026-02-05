require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mariadb = require('mariadb');

async function runMigrations() {
  // First connect without database to create it if needed
  const pool = mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'portal_user',
    password: process.env.DB_PASSWORD || '',
    connectionLimit: 1,
    multipleStatements: true
  });

  let conn;
  try {
    conn = await pool.getConnection();
    console.log('📦 Connected to MariaDB');

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await conn.query(statement);
        console.log('✅ Executed:', statement.substring(0, 50) + '...');
      } catch (err) {
        // Ignore "already exists" errors
        if (!err.message.includes('already exists') && !err.message.includes('Duplicate')) {
          console.error('❌ Error executing statement:', err.message);
        }
      }
    }

    console.log('\n✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
}

runMigrations();
