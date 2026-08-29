-- Create subscriptions table to track Stripe subscription status per user
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id   TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id      TEXT,
  status               TEXT NOT NULL DEFAULT 'free',  -- 'free' | 'active' | 'past_due' | 'canceled'
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscription row
CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only the service role (webhook) can insert/update
CREATE POLICY "subscriptions_service_insert"
  ON public.subscriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "subscriptions_service_update"
  ON public.subscriptions FOR UPDATE
  USING (true);
