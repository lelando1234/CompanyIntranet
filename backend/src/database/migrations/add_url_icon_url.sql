-- Add icon_url column to url_links table to support custom favicon URLs
ALTER TABLE url_links 
ADD COLUMN icon_url VARCHAR(500) NULL AFTER icon;

-- Add email_notifications_enabled to user_preferences or as a direct user preference
-- This will be handled via the existing user_preferences table with key 'email_notifications_enabled'
