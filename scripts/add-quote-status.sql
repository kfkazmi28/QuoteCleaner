-- Add status column to saved_quotes table
-- Allows tracking quote lifecycle: null (open) | 'completed' | future states
ALTER TABLE saved_quotes
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT NULL;

-- Index for filtering by status efficiently
CREATE INDEX IF NOT EXISTS saved_quotes_status_idx ON saved_quotes (user_id, status);

COMMENT ON COLUMN saved_quotes.status IS 'Quote lifecycle status: null = open/scheduled, completed = job done';
