-- Migration: extend signature_companies and email_signatures
ALTER TABLE signature_companies
  ADD COLUMN IF NOT EXISTS website_url   VARCHAR(500),
  ADD COLUMN IF NOT EXISTS disclaimer_text TEXT;

ALTER TABLE email_signatures
  ADD COLUMN IF NOT EXISTS custom_photo_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS disclaimer_text  TEXT;
