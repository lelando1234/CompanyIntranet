// Migration to add icon_url column to url_links table
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { query } = require('./connection');

async function migrate() {
  try {
    console.log('🔄 Running icon_url migration...');
    
    // Check if column already exists
    const columns = await query(`
      SHOW COLUMNS FROM url_links LIKE 'icon_url'
    `);
    
    if (columns.length === 0) {
      await query(`
        ALTER TABLE url_links 
        ADD COLUMN icon_url VARCHAR(500) NULL AFTER icon
      `);
      console.log('✅ icon_url column added to url_links table');
    } else {
      console.log('ℹ️  icon_url column already exists');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
