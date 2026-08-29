-- Add checklist_data column to saved_quotes
-- Stores the quote-specific customized checklist as JSONB
ALTER TABLE saved_quotes
  ADD COLUMN IF NOT EXISTS checklist_data JSONB DEFAULT NULL;

-- Ensure RLS policies exist for insert and update
-- (Safe to run even if policies already exist — drops and recreates)

DROP POLICY IF EXISTS "Users can insert their own quotes" ON saved_quotes;
CREATE POLICY "Users can insert their own quotes"
  ON saved_quotes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own quotes" ON saved_quotes;
CREATE POLICY "Users can update their own quotes"
  ON saved_quotes
  FOR UPDATE
  USING (auth.uid() = user_id);
