import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Hero } from "@/components/home/hero"
import { HowItWorks } from "@/components/home/how-it-works"
import { Benefits } from "@/components/home/benefits"
import { CalculatorCrmInfo } from "@/components/home/calculator-crm-info"
import { FeaturesPreview } from "@/components/home/features-preview"
import { Testimonials } from "@/components/home/testimonials"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <FeaturesPreview />
        <HowItWorks />
        <CalculatorCrmInfo />
        <Testimonials />
        <Benefits />
      </main>
      <Footer />
    </div>
  )
}
