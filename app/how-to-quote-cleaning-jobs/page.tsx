import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function QuoteCleaningJobsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="max-w-4xl mx-auto w-full px-6 py-12 flex-1">
      <h1 className="text-4xl font-bold mb-6">
        How to Quote Cleaning Jobs (Step-by-Step Guide)
      </h1>

      <p className="mb-6 text-lg">
        Quoting cleaning jobs accurately is one of the most important skills
        for any cleaning business. Price too low and you lose money. Price too high
        and you lose the job. This guide shows you exactly how professionals
        estimate cleaning jobs the right way.
      </p>

      <div className="mb-10">
        <a
          href="/cleaning-estimate-calculator"
          className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold"
        >
          Generate a Quote Instantly
        </a>
      </div>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Step 1: Determine the Size of the Property
      </h2>

      <p className="mb-6">
        Start by getting the square footage or number of bedrooms and bathrooms.
        Larger homes require more time, labor, and supplies.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Step 2: Evaluate the Condition
      </h2>

      <p className="mb-6">
        Not all homes are equal. A well-maintained home takes far less time than
        a first-time or deep clean.
      </p>

      <ul className="list-disc pl-6 mb-6">
        <li>Light clean (well-kept)</li>
        <li>Standard clean (average condition)</li>
        <li>Deep clean (buildup, first-time service)</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Step 3: Estimate Time Required
      </h2>

      <p className="mb-6">
        Most cleaning businesses base pricing on time. For example:
      </p>

      <ul className="list-disc pl-6 mb-6">
        <li>Small home: 2–3 hours</li>
        <li>Medium home: 3–5 hours</li>
        <li>Large home: 5+ hours</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Step 4: Apply Your Hourly or Flat Rate
      </h2>

      <p className="mb-6">
        Multiply your estimated time by your hourly rate, or convert it into a flat
        price for the client. Most professionals prefer flat-rate pricing because
        it’s easier to sell and scale.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Step 5: Add Extra Services
      </h2>

      <ul className="list-disc pl-6 mb-6">
        <li>Inside oven</li>
        <li>Inside fridge</li>
        <li>Move-in / move-out cleaning</li>
        <li>Deep scrubbing</li>
      </ul>

      <p className="mb-6">
        These add-ons should always be priced separately to increase your profit per job.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Example Cleaning Quote
      </h2>

      <div className="bg-gray-100 p-6 rounded-2xl mb-6">
        <p className="mb-2"><strong>Home size:</strong> 1,500 sq ft</p>
        <p className="mb-2"><strong>Condition:</strong> Standard</p>
        <p className="mb-2"><strong>Estimated time:</strong> 4 hours</p>
        <p className="mb-2"><strong>Rate:</strong> $50/hour</p>
        <p className="mb-2"><strong>Total:</strong> $200</p>
      </div>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        The Problem With Manual Quotes
      </h2>

      <p className="mb-6">
        Manually calculating quotes every time is slow and inconsistent. It often
        leads to underpricing or overpricing jobs.
      </p>

      <div className="bg-gray-100 p-6 rounded-2xl mt-6">
        <p className="mb-4 font-semibold">
          👉 Use our cleaning estimate calculator to generate accurate quotes instantly.
        </p>

        <a
          href="/cleaning-estimate-calculator"
          className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold"
        >
          Try the Calculator
        </a>
      </div>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Final Tip
      </h2>

      <p className="mb-6">
        The most successful cleaning businesses don’t guess pricing—they use systems.
        The faster and more consistent your quoting process is, the more jobs you’ll win.
      </p>
    </main>
      <Footer />
    </div>
  )
}
