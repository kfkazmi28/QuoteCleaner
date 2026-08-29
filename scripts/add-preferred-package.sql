-- Add preferred_package column to saved_quotes table
ALTER TABLE saved_quotes
ADD COLUMN IF NOT EXISTS preferred_package TEXT;

-- Add comment for documentation
COMMENT ON COLUMN saved_quotes.preferred_package IS 'Client preferred cleaning package (e.g., move-in-/-move-out, deep-clean, single, monthly, bi-weekly, weekly)';
