// Migration to add user_preferences table
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { query } = require('./connection');

async function migrate() {
  try {
    console.log('🔄 Running user_preferences migration...');
    
    await query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id VARCHAR(36) NOT NULL,
        pref_key VARCHAR(100) NOT NULL,
        pref_value LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, pref_key),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    
    console.log('✅ user_preferences table created/verified');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
