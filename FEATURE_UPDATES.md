# New Features Added

## 1. Custom Icons for URL Links (Favicons)

You can now add small favicon-sized images to URL links in the dashboard.

### How to use:
1. Go to Admin Panel → URL Categories
2. When creating or editing a URL link, you'll see a new field: **"Icon URL (optional)"**
3. Add the URL of a favicon or small image (e.g., `https://example.com/favicon.ico`)
4. The image will appear next to the link in the sidebar navigation

### Features:
- Falls back to the icon if the image fails to load
- Supports any image URL (favicons, logos, etc.)
- Image size is automatically constrained to 16x16px (favicon size)

## 2. Icon Selection for URL Categories

URL categories now have a dropdown menu to select from available icons instead of just using the default "Link" icon.

### How to use:
1. Go to Admin Panel → URL Categories
2. When creating or editing a category, use the **Icon** dropdown
3. Choose from 30+ available icons including:
   - Link, Globe, Book, File
   - Users, Mail, Phone, Calendar
   - Settings, Database, Code
   - And many more!

## 3. Email Notification Toggle

Users can now disable email notifications from their profile settings.

### How to use:
1. Go to Profile (click your avatar → Profile)
2. Scroll to the **"Email Notifications"** section
3. Toggle the switch to enable/disable email notifications
4. Click **"Save Notification Preferences"**

### Notes:
- This preference is stored per-user
- When disabled, the user will not receive email notifications for:
  - New articles
  - Announcements
  - Portal updates

---

## Database Migration

**IMPORTANT:** To enable the favicon feature, you need to add the new `icon_url` column to the database.

Run this command on your server where the database is accessible:

```bash
cd backend
node src/database/migrate-icon-url.js
```

Or run the SQL manually:

```sql
ALTER TABLE url_links 
ADD COLUMN icon_url VARCHAR(500) NULL AFTER icon;
```

This migration is safe to run multiple times - it will check if the column already exists before attempting to add it.

**Note:** The migration cannot be run in the Tempo development environment as it doesn't have direct database access. Run it on your production/staging server where the backend is deployed.
