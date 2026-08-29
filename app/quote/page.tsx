import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { QuoteCalculator } from "@/components/quote-calculator"

export const metadata = {
  title: "Free Cleaning Quote Calculator | CleanQuote Pro",
  description: "Create a free cleaning quote instantly with CleanQuote Pro's online calculator.",
}

export default function PublicQuotePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Create your free cleaning quote
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-pretty text-muted-foreground">
              Try the calculator right away. Enter the home details below to generate an instant estimate.
            </p>
          </div>
          <QuoteCalculator />
        </div>
      </main>
      <Footer />
    </div>
  )
}

