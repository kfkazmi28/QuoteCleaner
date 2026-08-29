-- Add is_active column to client_contacts for tracking active clients
ALTER TABLE client_contacts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Index for filtering by active status
CREATE INDEX IF NOT EXISTS idx_client_contacts_is_active ON client_contacts(is_active);
