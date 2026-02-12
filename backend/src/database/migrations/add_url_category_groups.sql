-- Migration: Add URL Category Groups table for group-based visibility
-- Date: 2024

-- URL Category-Group visibility (many-to-many)
CREATE TABLE IF NOT EXISTS url_category_groups (
    url_category_id VARCHAR(36) NOT NULL,
    group_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (url_category_id, group_id),
    FOREIGN KEY (url_category_id) REFERENCES url_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_url_category_groups_url_cat ON url_category_groups(url_category_id);
CREATE INDEX IF NOT EXISTS idx_url_category_groups_group ON url_category_groups(group_id);
