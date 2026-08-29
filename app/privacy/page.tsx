import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Privacy Policy</h1>
          <p className="mt-4 text-muted-foreground">Last updated: April 2026</p>

          <div className="mt-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
              <p className="mt-2 text-muted-foreground">
                We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support. This may include your email address, password, and cleaning quote data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
              <p className="mt-2 text-muted-foreground">
                We use the information we collect to provide, maintain, and improve our services, process transactions, send you related information, and respond to your comments, questions, and requests.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">3. Information Sharing</h2>
              <p className="mt-2 text-muted-foreground">
                We do not share your personal information with third parties except as described in this policy. We may share information with service providers who perform services on our behalf.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">4. Data Security</h2>
              <p className="mt-2 text-muted-foreground">
                We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">5. Cookies</h2>
              <p className="mt-2 text-muted-foreground">
                We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">6. Your Rights</h2>
              <p className="mt-2 text-muted-foreground">
                You may update, correct, or delete your account information at any time by logging into your account or contacting us. You may also request a copy of your personal data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">7. Contact Us</h2>
              <p className="mt-2 text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us at{" "}
                <a href="mailto:privacy@cleanquotepro.com" className="text-primary hover:underline">
                  privacy@cleanquotepro.com
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
