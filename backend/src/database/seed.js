require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('./connection');

async function seed() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Create default admin user
    const adminId = uuidv4();
    const adminPassword = await bcrypt.hash('admin123', 12);
    
    try {
      await query(`
        INSERT INTO users (id, email, password, name, role, department, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [adminId, 'admin@company.com', adminPassword, 'Admin User', 'admin', 'IT', 'active']);
      console.log('✅ Created admin user: admin@company.com / admin123');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log('ℹ️  Admin user already exists');
      } else throw err;
    }

    // Create editor user
    const editorId = uuidv4();
    const editorPassword = await bcrypt.hash('editor123', 12);
    
    try {
      await query(`
        INSERT INTO users (id, email, password, name, role, department, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [editorId, 'editor@company.com', editorPassword, 'Editor User', 'editor', 'Marketing', 'active']);
      console.log('✅ Created editor user: editor@company.com / editor123');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log('ℹ️  Editor user already exists');
      } else throw err;
    }

    // Create regular user
    const userId = uuidv4();
    const userPassword = await bcrypt.hash('user123', 12);
    
    try {
      await query(`
        INSERT INTO users (id, email, password, name, role, department, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [userId, 'user@company.com', userPassword, 'Regular User', 'user', 'Sales', 'active']);
      console.log('✅ Created regular user: user@company.com / user123');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log('ℹ️  Regular user already exists');
      } else throw err;
    }

    // Create default groups
    const groups = [
      { name: 'Administrators', description: 'Full system access', color: '#EF4444' },
      { name: 'Editors', description: 'Content management access', color: '#F59E0B' },
      { name: 'Staff', description: 'Standard employee access', color: '#3B82F6' }
    ];

    for (const group of groups) {
      const groupId = uuidv4();
      try {
        await query(`
          INSERT INTO \`groups\` (id, name, description, color)
          VALUES (?, ?, ?, ?)
        `, [groupId, group.name, group.description, group.color]);
        console.log(`✅ Created group: ${group.name}`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`ℹ️  Group ${group.name} already exists`);
        } else throw err;
      }
    }

    // Create news categories
    const categories = [
      { name: 'Company News', slug: 'company-news', color: '#3B82F6' },
      { name: 'Announcements', slug: 'announcements', color: '#10B981' },
      { name: 'Events', slug: 'events', color: '#8B5CF6' },
      { name: 'HR Updates', slug: 'hr-updates', color: '#F59E0B' },
      { name: 'IT Notices', slug: 'it-notices', color: '#EF4444' }
    ];

    for (const category of categories) {
      const catId = uuidv4();
      try {
        await query(`
          INSERT INTO news_categories (id, name, slug, color)
          VALUES (?, ?, ?, ?)
        `, [catId, category.name, category.slug, category.color]);
        console.log(`✅ Created category: ${category.name}`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`ℹ️  Category ${category.name} already exists`);
        } else throw err;
      }
    }

    // Create URL categories
    const urlCategories = [
      { name: 'Internal Tools', description: 'Company internal applications', icon: 'Wrench' },
      { name: 'HR Resources', description: 'Human resources links', icon: 'Users' },
      { name: 'Documentation', description: 'Company documentation', icon: 'FileText' },
      { name: 'External Links', description: 'Useful external resources', icon: 'ExternalLink' }
    ];

    for (const urlCat of urlCategories) {
      const urlCatId = uuidv4();
      try {
        await query(`
          INSERT INTO url_categories (id, name, description, icon)
          VALUES (?, ?, ?, ?)
        `, [urlCatId, urlCat.name, urlCat.description, urlCat.icon]);
        console.log(`✅ Created URL category: ${urlCat.name}`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`ℹ️  URL category ${urlCat.name} already exists`);
        } else throw err;
      }
    }

    // Create default settings
    const settings = [
      { key: 'site_name', value: 'Company Portal', type: 'string' },
      { key: 'site_description', value: 'Internal company communication portal', type: 'string' },
      { key: 'admin_email', value: 'admin@company.com', type: 'string' },
      { key: 'allow_registration', value: 'false', type: 'boolean' },
      { key: 'maintenance_mode', value: 'false', type: 'boolean' },
      { key: 'articles_per_page', value: '10', type: 'number' },
      { key: 'welcome_message', value: 'Welcome to the Company Portal', type: 'string' },
      { key: 'welcome_subtext', value: 'Stay updated with the latest company news and access your personalized resources.', type: 'string' },
      { key: 'show_welcome', value: 'true', type: 'boolean' },
      { key: 'copyright_text', value: '© 2024 Company Portal. All rights reserved.', type: 'string' },
    ];

    for (const setting of settings) {
      const settingId = uuidv4();
      try {
        await query(`
          INSERT INTO settings (id, setting_key, setting_value, setting_type)
          VALUES (?, ?, ?, ?)
        `, [settingId, setting.key, setting.value, setting.type]);
        console.log(`✅ Created setting: ${setting.key}`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`ℹ️  Setting ${setting.key} already exists`);
        } else throw err;
      }
    }

    // Create default theme
    const themeId = uuidv4();
    try {
      await query(`
        INSERT INTO theme_settings (id, name, primary_color, secondary_color, accent_color, background_type, background_value, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [themeId, 'default', '#3B82F6', '#6366F1', '#8B5CF6', 'gradient', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', true]);
      console.log('✅ Created default theme');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log('ℹ️  Default theme already exists');
      } else throw err;
    }

    // Create sample articles
    const adminUser = await query('SELECT id FROM users WHERE email = ?', ['admin@company.com']);
    const companyNewsCategory = await query('SELECT id FROM news_categories WHERE slug = ?', ['company-news']);
    
    if (adminUser.length > 0 && companyNewsCategory.length > 0) {
      const sampleArticles = [
        {
          title: 'Welcome to the Company Portal',
          content: '<p>Welcome to our new company portal! This platform will serve as our central hub for company news, announcements, and resources.</p><p>Key features include:</p><ul><li>Company news and updates</li><li>Resource links</li><li>Team collaboration tools</li></ul>',
          excerpt: 'Welcome to our new company portal!',
          status: 'published'
        },
        {
          title: 'Q4 Goals and Objectives',
          content: '<p>As we enter Q4, here are our key objectives and goals for the quarter...</p><p>Focus areas:</p><ol><li>Customer satisfaction improvement</li><li>Product enhancement</li><li>Team development</li></ol>',
          excerpt: 'Key objectives for the final quarter of the year.',
          status: 'published'
        }
      ];

      for (const article of sampleArticles) {
        const articleId = uuidv4();
        try {
          await query(`
            INSERT INTO articles (id, title, content, excerpt, category_id, author_id, status, published_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
          `, [articleId, article.title, article.content, article.excerpt, companyNewsCategory[0].id, adminUser[0].id, article.status]);
          console.log(`✅ Created article: ${article.title}`);
        } catch (err) {
          console.log(`ℹ️  Article creation skipped: ${err.message}`);
        }
      }
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📋 Default credentials:');
    console.log('   Admin:  admin@company.com / admin123');
    console.log('   Editor: editor@company.com / editor123');
    console.log('   User:   user@company.com / user123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
