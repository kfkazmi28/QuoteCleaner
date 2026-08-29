import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Terms of Service</h1>
          <p className="mt-4 text-muted-foreground">Last updated: April 2026</p>

          <div className="mt-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p className="mt-2 text-muted-foreground">
                By accessing and using CleanQuote Pro, you accept and agree to be bound by the terms and provisions of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">2. Use License</h2>
              <p className="mt-2 text-muted-foreground">
                Permission is granted to temporarily use CleanQuote Pro for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">3. Disclaimer</h2>
              <p className="mt-2 text-muted-foreground">
                The materials on CleanQuote Pro are provided on an &apos;as is&apos; basis. CleanQuote Pro makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">4. Limitations</h2>
              <p className="mt-2 text-muted-foreground">
                In no event shall CleanQuote Pro or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on CleanQuote Pro.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">5. Revisions</h2>
              <p className="mt-2 text-muted-foreground">
                CleanQuote Pro may revise these terms of service at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">6. Contact Information</h2>
              <p className="mt-2 text-muted-foreground">
                If you have any questions about these Terms, please contact us at{" "}
                <a href="mailto:support@cleanquotepro.com" className="text-primary hover:underline">
                  support@cleanquotepro.com
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
