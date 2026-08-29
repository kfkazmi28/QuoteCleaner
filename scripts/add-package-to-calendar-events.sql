ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS package_name text,
  ADD COLUMN IF NOT EXISTS package_price numeric(10,2);
