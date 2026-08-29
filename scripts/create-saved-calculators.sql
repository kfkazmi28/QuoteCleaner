-- Create saved_calculators table for storing named pricing presets
CREATE TABLE IF NOT EXISTS saved_calculators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  settings JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_saved_calculators_user_id ON saved_calculators(user_id);

-- Unique constraint: one name per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_calculators_user_name ON saved_calculators(user_id, name);

-- Enable RLS
ALTER TABLE saved_calculators ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own calculators"
  ON saved_calculators FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calculators"
  ON saved_calculators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calculators"
  ON saved_calculators FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calculators"
  ON saved_calculators FOR DELETE
  USING (auth.uid() = user_id);
