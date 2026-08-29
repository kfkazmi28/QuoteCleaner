-- Add day_pass_expires_at to subscriptions table
-- Run once in your Supabase SQL editor

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS day_pass_expires_at TIMESTAMPTZ DEFAULT NULL;

-- Index for fast expiry lookups
CREATE INDEX IF NOT EXISTS subscriptions_day_pass_expires_at_idx
  ON subscriptions (user_id, day_pass_expires_at);
