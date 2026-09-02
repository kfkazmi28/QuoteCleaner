import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPublicBookingForm } from "@/app/actions/booking-forms"
import { BookingFlow } from "@/components/booking-forms/booking-flow"
import { COMPANY_NAME } from "@/lib/company-config"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const form = await getPublicBookingForm(slug)
  if (!form) return { title: "Booking form not found" }
  const who = form.business_name ?? COMPANY_NAME
  return {
    title: `${form.title} | ${who}`,
    description: form.intro ?? `Get an instant cleaning quote and request an appointment with ${who}.`,
    robots: { index: false },
  }
}

export default async function PublicBookingPage({ params }: Params) {
  const { slug } = await params
  const form = await getPublicBookingForm(slug)
  if (!form) notFound()

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
        <header className="flex flex-col gap-3">
          {form.business_name && (
            <p className="text-sm font-medium uppercase tracking-wide text-primary">{form.business_name}</p>
          )}
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{form.title}</h1>
          {form.intro && <p className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">{form.intro}</p>}
        </header>

        {form.is_active ? (
          <BookingFlow slug={form.slug} businessName={form.business_name} />
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <h2 className="text-lg font-semibold text-foreground">This form isn&apos;t accepting requests right now</h2>
            <p className="mt-2 text-sm text-muted-foreground">Please check back later or contact us directly.</p>
          </div>
        )}

        <footer className="text-center text-xs text-muted-foreground">
          Estimates are based on the details you provide and may be adjusted after a walkthrough.
        </footer>
      </main>
    </div>
  )
}
