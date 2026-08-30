import Stripe from "stripe"

let stripeClient: Stripe | undefined

/**
 * Lazily create Stripe so importing server actions does not crash the preview
 * when the secret key is not available during module evaluation.
 */
export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error("Stripe is not configured: STRIPE_SECRET_KEY is missing")
  }

  stripeClient ??= new Stripe(secretKey)
  return stripeClient
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, property, receiver) {
    const client = getStripe()
    const value = Reflect.get(client, property, receiver)
    return typeof value === "function" ? value.bind(client) : value
  },
})
