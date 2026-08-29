import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function CleaningEstimateCalculatorPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="max-w-4xl mx-auto w-full px-6 py-12 flex-1">
      <h1 className="text-4xl font-bold mb-6">
        Free Cleaning Estimate Calculator (Instant Quotes for Cleaning Businesses)
      </h1>

      <p className="mb-6 text-lg">
        Create accurate cleaning quotes in seconds with our free cleaning estimate calculator.
        Whether you run a residential cleaning service or a commercial business,
        this tool helps you price jobs faster, save time, and win more clients.
      </p>

      <div className="mb-10">
        <a
          href="/"
          className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold"
        >
          Start Free Quote
        </a>
      </div>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Why Use a Cleaning Estimate Calculator?
      </h2>
      <p className="mb-6">
        Pricing cleaning jobs manually can lead to undercharging, overcharging,
        and inconsistent quotes. A calculator helps standardize pricing and ensures accuracy.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        How to Calculate Cleaning Prices
      </h2>
      <ul className="list-disc pl-6 mb-6">
        <li>Home size</li>
        <li>Cleaning condition (light, medium, heavy)</li>
        <li>Time required</li>
        <li>Add-ons like oven or fridge cleaning</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Average Cleaning Prices
      </h2>
      <ul className="list-disc pl-6 mb-6">
        <li>Small homes: $100 – $150</li>
        <li>Medium homes: $150 – $250</li>
        <li>Large homes: $250+</li>
        <li>Deep cleans: 1.5x – 2x standard</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Start Creating Professional Quotes Today
      </h2>
      <p className="mb-6">
        Stop guessing your pricing and start quoting like a pro.
      </p>

      <a
        href="/"
        className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold"
      >
        Start Free Quote
      </a>
    </main>
      <Footer />
    </div>
  )
}
