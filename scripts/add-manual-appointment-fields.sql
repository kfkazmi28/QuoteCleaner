-- Add manual appointment support to calendar_events
-- event_type: 'quote-linked' (default) | 'manual'
ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS event_type        text NOT NULL DEFAULT 'quote-linked',
  ADD COLUMN IF NOT EXISTS client_name       text,
  ADD COLUMN IF NOT EXISTS client_email      text,
  ADD COLUMN IF NOT EXISTS client_phone      text,
  ADD COLUMN IF NOT EXISTS service_type      text,
  ADD COLUMN IF NOT EXISTS recurrence_rule   text,        -- 'weekly' | 'biweekly' | 'monthly'
  ADD COLUMN IF NOT EXISTS recurrence_end_date date,
  ADD COLUMN IF NOT EXISTS recurrence_occurrences int;
