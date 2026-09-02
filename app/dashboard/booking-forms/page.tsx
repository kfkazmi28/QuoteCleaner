import { DashboardNav } from "@/components/dashboard-nav"
import { BookingFormsManager } from "@/components/booking-forms/booking-forms-manager"
import { getBookingForms } from "@/app/actions/booking-forms"
import { getSavedCalculators } from "@/app/actions/calculators"

export const dynamic = "force-dynamic"

export default async function BookingFormsPage() {
  const [{ data: forms, error }, { data: calculators }] = await Promise.all([getBookingForms(), getSavedCalculators()])

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:ml-64 lg:px-8">
        <header className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Booking Forms</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Share a link where clients answer the same questions as your calculator, see their price instantly, and
            request an appointment. Your pricing settings stay private.
          </p>
        </header>
        <BookingFormsManager initialForms={forms} calculators={calculators} loadError={error} />
      </main>
    </div>
  )
}
