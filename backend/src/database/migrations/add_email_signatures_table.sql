-- Email Signatures Table
-- Each signature is a configured template assigned to one user (UNIQUE constraint enforces 1-per-user)
CREATE TABLE IF NOT EXISTS email_signatures (
    id                  VARCHAR(36)  NOT NULL PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    -- Contact fields (all optional; populated from user profile or entered manually)
    full_name           VARCHAR(255),
    job_title           VARCHAR(255),
    department          VARCHAR(100),
    company_name        VARCHAR(255),
    phone               VARCHAR(50),
    mobile              VARCHAR(50),
    email               VARCHAR(255),
    website_url         VARCHAR(500),
    office_address      TEXT,
    -- Display toggles
    show_profile_photo  TINYINT(1)   NOT NULL DEFAULT 0,
    show_company_logo   TINYINT(1)   NOT NULL DEFAULT 0,
    -- Social links (NULL = not rendered)
    social_linkedin     VARCHAR(500),
    social_twitter      VARCHAR(500),
    social_facebook     VARCHAR(500),
    social_instagram    VARCHAR(500),
    social_github       VARCHAR(500),
    social_youtube      VARCHAR(500),
    social_custom_url   VARCHAR(500),
    social_custom_label VARCHAR(100),
    -- Design options
    template            VARCHAR(50)  NOT NULL DEFAULT 'horizontal',
    primary_color       VARCHAR(20)  NOT NULL DEFAULT '#0080ff',
    font_family         VARCHAR(50)  NOT NULL DEFAULT 'Arial',
    -- Assignment: one signature per user
    assigned_to         VARCHAR(36)  DEFAULT NULL,
    created_by          VARCHAR(36)  NOT NULL,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sig_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_sig_created_by  FOREIGN KEY (created_by)  REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_sig_assigned_to (assigned_to),
    INDEX idx_sig_assigned_to (assigned_to),
    INDEX idx_sig_created_by  (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
