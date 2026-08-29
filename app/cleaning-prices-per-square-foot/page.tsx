import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function CleaningSquareFootPricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="max-w-4xl mx-auto w-full px-6 py-12 flex-1">
      <h1 className="text-4xl font-bold mb-6">
        Cleaning Prices Per Square Foot (2026 Pricing Guide)
      </h1>

      <p className="mb-6 text-lg">
        Wondering how much to charge per square foot for cleaning services?
        This guide breaks down real pricing ranges used by professional cleaners
        so you can price jobs accurately and stay profitable.
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
        Average Cleaning Price Per Square Foot
      </h2>

      <ul className="list-disc pl-6 mb-6">
        <li>$0.10 – $0.15 per sq ft (light cleaning)</li>
        <li>$0.15 – $0.25 per sq ft (standard cleaning)</li>
        <li>$0.25 – $0.40+ per sq ft (deep cleaning)</li>
      </ul>

      <p className="mb-6">
        These rates vary based on location, labor costs, and the level of service provided.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Example Cleaning Pricing by Home Size
      </h2>

      <ul className="list-disc pl-6 mb-6">
        <li>1,000 sq ft → $100 – $200</li>
        <li>1,500 sq ft → $150 – $300</li>
        <li>2,000 sq ft → $200 – $400+</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Residential vs Commercial Rates
      </h2>

      <p className="mb-6">
        Residential cleaning is typically priced higher per square foot due to
        more detailed work. Commercial cleaning often ranges from $0.08 – $0.20 per sq ft
        depending on frequency and scope.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        What Affects Price Per Square Foot?
      </h2>

      <ul className="list-disc pl-6 mb-6">
        <li>Condition of the property</li>
        <li>Number of bathrooms and kitchens</li>
        <li>Pets, clutter, or buildup</li>
        <li>Frequency (recurring vs one-time)</li>
        <li>Special add-ons (oven, fridge, deep scrubbing)</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Should You Charge Per Square Foot?
      </h2>

      <p className="mb-6">
        Charging per square foot is a great starting point, but most professional
        cleaning businesses eventually switch to flat-rate pricing for consistency
        and easier quoting.
      </p>

      <div className="bg-gray-100 p-6 rounded-2xl mt-6">
        <p className="mb-4 font-semibold">
          👉 Want more accurate pricing than square foot estimates?
        </p>

        <a
          href="/cleaning-estimate-calculator"
          className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold"
        >
          Try the Free Calculator
        </a>
      </div>
    </main>
      <Footer />
    </div>
  )
}
