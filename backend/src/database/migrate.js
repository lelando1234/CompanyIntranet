require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mariadb = require('mariadb');

async function runMigrations() {
  const dbName = process.env.DB_NAME || 'company_portal';
  
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
  let migrationFailed = false;
  
  try {
    conn = await pool.getConnection();
    console.log('📦 Connected to MariaDB');
    console.log(`📂 Target database: ${dbName}`);

    // Create database if not exists
    try {
      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`✅ Database '${dbName}' created or already exists`);
    } catch (err) {
      console.error(`❌ Failed to create database: ${err.message}`);
      migrationFailed = true;
      throw err;
    }

    // Switch to the database
    try {
      await conn.query(`USE \`${dbName}\``);
      console.log(`✅ Switched to database '${dbName}'`);
    } catch (err) {
      console.error(`❌ Failed to switch to database '${dbName}': ${err.message}`);
      console.error('   Make sure the database user has proper permissions.');
      console.error('   Run: GRANT ALL PRIVILEGES ON ' + dbName + '.* TO "your_user"@"localhost";');
      migrationFailed = true;
      throw err;
    }

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Remove comments and split by semicolon properly
    const cleanSchema = schema
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    // Split by semicolon followed by newline or end of file
    const statements = cleanSchema
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`📄 Found ${statements.length} SQL statements to execute`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await conn.query(statement);
        const preview = statement.substring(0, 60).replace(/\n/g, ' ');
        console.log(`✅ [${i+1}/${statements.length}] Executed: ${preview}...`);
        successCount++;
      } catch (err) {
        // Ignore "already exists" errors
        if (!err.message.includes('already exists') && !err.message.includes('Duplicate')) {
          console.error(`❌ [${i+1}/${statements.length}] Error: ${err.message}`);
          console.error(`   SQL: ${statement.substring(0, 200)}`);
          errorCount++;
        } else {
          console.log(`⏭️  [${i+1}/${statements.length}] Skipped (already exists)`);
          successCount++;
        }
      }
    }

    if (errorCount > 0) {
      console.log(`\n⚠️  Migration completed with ${errorCount} errors and ${successCount} successful statements.`);
    } else {
      console.log(`\n✅ Database migration completed successfully! (${successCount} statements executed)`);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    migrationFailed = true;
  } finally {
    if (conn) conn.release();
    await pool.end();
  }

  if (migrationFailed) {
    process.exit(1);
  }
}

runMigrations();
