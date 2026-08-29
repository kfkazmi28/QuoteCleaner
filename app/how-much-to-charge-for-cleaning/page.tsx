import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function CleaningPricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="max-w-4xl mx-auto w-full px-6 py-12 flex-1">
      <h1 className="text-4xl font-bold mb-6">
        How Much to Charge for Cleaning (2026 Pricing Guide)
      </h1>

      <p className="mb-6 text-lg">
        Not sure how much to charge for cleaning services? This guide breaks down
        real pricing strategies used by professional cleaners so you can price
        jobs confidently and profitably.
      </p>

      <div className="mb-10">
        <a
          href="/cleaning-estimate-calculator"
          className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold"
        >
          Use Free Cleaning Calculator
        </a>
      </div>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Average House Cleaning Rates
      </h2>

      <ul className="list-disc pl-6 mb-6">
        <li>$100 – $150 for small homes</li>
        <li>$150 – $250 for medium homes</li>
        <li>$250+ for large homes</li>
        <li>Deep cleaning: 1.5x – 2x standard rate</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Pricing Per Square Foot
      </h2>

      <p className="mb-6">
        Many cleaning businesses charge between <strong>$0.10 – $0.30 per square foot</strong>
        depending on location and service level.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Factors That Affect Cleaning Prices
      </h2>

      <ul className="list-disc pl-6 mb-6">
        <li>Home size</li>
        <li>Condition of the property</li>
        <li>Frequency (one-time vs recurring)</li>
        <li>Add-ons like oven or fridge cleaning</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Hourly vs Flat Rate Pricing
      </h2>

      <p className="mb-6">
        Some cleaners charge hourly ($25–$75 per hour), while others use flat-rate pricing.
        Flat rates are easier to scale and more predictable for customers.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        How to Price Cleaning Jobs Accurately
      </h2>

      <p className="mb-6">
        The best way to price jobs is by using a structured system that accounts for
        time, size, and condition. Guessing leads to lost profit.
      </p>

      <div className="bg-gray-100 p-6 rounded-2xl mt-6">
        <p className="mb-4 font-semibold">
          👉 Use our free cleaning estimate calculator to generate accurate quotes instantly.
        </p>

        <a
          href="/cleaning-estimate-calculator"
          className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold"
        >
          Try the Calculator
        </a>
      </div>
    </main>
      <Footer />
    </div>
  )
}
