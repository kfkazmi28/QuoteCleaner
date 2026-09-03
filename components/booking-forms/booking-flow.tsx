"use client"

import { useState, useTransition } from "react"
import { ArrowLeft, ArrowRight, Check, Loader2, MapPin, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getPublicBookingPrices, submitBookingRequest } from "@/app/actions/booking-forms"
import { type BookingHomeDetails, type BookingSubmission, type PublicBookingForm } from "@/lib/booking-forms"
import type { TierCard } from "@/lib/pricing"

type Props = Pick<PublicBookingForm, "business_name"> & { slug: string; businessName?: string | null }
const initialHome: BookingHomeDetails = { squareFootage: "", sqftUnit: "sqft", cleanLevel: "2", bedrooms: "", bathrooms: "", pets: "0", children: "0" }
const inputClass = "h-11"

export function BookingFlow({ slug, businessName }: Props) {
  const [step, setStep] = useState(1)
  const [home, setHome] = useState(initialHome)
  const [cards, setCards] = useState<TierCard[]>([])
  const [selected, setSelected] = useState<TierCard | null>(null)
  const [client, setClient] = useState({ name: "", email: "", phone: "", address: "", preferredDate: "", timeWindow: "morning", notes: "" })
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  const updateHome = (key: keyof BookingHomeDetails, value: string) => setHome((v) => ({ ...v, [key]: value }))
  const updateClient = (key: keyof typeof client, value: string) => setClient((v) => ({ ...v, [key]: value }))

  function calculate() {
    setError("")
    startTransition(async () => {
      const result = await getPublicBookingPrices(slug, home)
      if (result.error) return setError(result.error)
      setCards(result.cards ?? [])
      setStep(2)
    })
  }
  function submit() {
    setError("")
    startTransition(async () => {
      if (!selected) return setError("Please choose a service.")
      const result = await submitBookingRequest({ slug, home, tier: selected.key, client } as BookingSubmission)
      if (result.error) return setError(result.error)
      setStep(4)
    })
  }

  if (step === 4) return <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"><Check className="h-7 w-7" /></div><h2 className="mt-5 text-2xl font-semibold text-foreground">Request received</h2><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">Thanks for reaching out{client.name ? `, ${client.name.split(" ")[0]}` : ""}. We&apos;ll review your details and contact you to confirm your appointment.</p><div className="mt-6 rounded-lg bg-muted/50 p-4 text-left text-sm"><p className="font-medium text-foreground">{selected?.label} · ${selected?.price.toLocaleString()}{selected?.recurring ? " per visit" : ""}</p><p className="mt-1 text-muted-foreground">{client.preferredDate} · {client.timeWindow}</p></div></section>

  return <section className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><span className={step >= 1 ? "text-primary" : ""}>1 Details</span><span>/</span><span className={step >= 2 ? "text-primary" : ""}>2 Estimate</span><span>/</span><span className={step >= 3 ? "text-primary" : ""}>3 Request</span></div>
    {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
    {step === 1 && <div className="flex flex-col gap-5"><div><h2 className="text-xl font-semibold text-foreground">Tell us about your home</h2><p className="mt-1 text-sm text-muted-foreground">We&apos;ll use these details to prepare your estimate.</p></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Home size"><div className="flex gap-2"><Input className={inputClass} type="number" min="1" value={home.squareFootage} onChange={(e) => updateHome("squareFootage", e.target.value)} placeholder="1,500" /><select className="h-11 rounded-md border border-input bg-background px-3 text-sm" value={home.sqftUnit} onChange={(e) => updateHome("sqftUnit", e.target.value)}><option value="sqft">sq ft</option><option value="sqm">m²</option></select></div></Field><Field label="Cleaning type"><select className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={home.cleanLevel} onChange={(e) => updateHome("cleanLevel", e.target.value)}><option value="1">Light clean</option><option value="2">Standard clean</option><option value="3">Deep clean</option></select></Field><Field label="Bedrooms"><Input className={inputClass} type="number" min="0" value={home.bedrooms} onChange={(e) => updateHome("bedrooms", e.target.value)} placeholder="3" /></Field><Field label="Bathrooms"><Input className={inputClass} type="number" min="0" value={home.bathrooms} onChange={(e) => updateHome("bathrooms", e.target.value)} placeholder="2" /></Field><Field label="Pets"><Input className={inputClass} type="number" min="0" value={home.pets} onChange={(e) => updateHome("pets", e.target.value)} placeholder="0" /></Field><Field label="Children"><Input className={inputClass} type="number" min="0" value={home.children} onChange={(e) => updateHome("children", e.target.value)} placeholder="0" /></Field></div><Button onClick={calculate} disabled={pending} className="h-11 w-full sm:w-auto sm:self-end">{pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}See my estimate</Button></div>}
    {step === 2 && <div className="flex flex-col gap-5"><div><h2 className="text-xl font-semibold text-foreground">Choose your service</h2><p className="mt-1 text-sm text-muted-foreground">Select the option that best fits your needs.</p></div><div className="grid gap-3 sm:grid-cols-2">{cards.map((card) => <button type="button" key={card.key} onClick={() => setSelected(card)} className={`rounded-xl border p-4 text-left transition-colors ${selected?.key === card.key ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/50"}`}><div className="flex items-start justify-between gap-3"><span className="font-medium text-foreground">{card.label}</span><span className="text-lg font-semibold text-primary">${card.price.toLocaleString()}</span></div>{card.recurring && <p className="mt-1 text-xs text-muted-foreground">per visit</p>}</button>)}</div><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button><Button onClick={() => selected ? setStep(3) : setError("Please choose a service.")} disabled={!selected}>Request this service<ArrowRight className="ml-2 h-4 w-4" /></Button></div></div>}
    {step === 3 && <div className="flex flex-col gap-5"><div><h2 className="text-xl font-semibold text-foreground">Request your appointment</h2><p className="mt-1 text-sm text-muted-foreground">We&apos;ll confirm the final appointment with you.</p></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Full name" required><Input className={inputClass} value={client.name} onChange={(e) => updateClient("name", e.target.value)} autoComplete="name" /></Field><Field label="Email" required><Input className={inputClass} type="email" value={client.email} onChange={(e) => updateClient("email", e.target.value)} autoComplete="email" /></Field><Field label="Phone" required><Input className={inputClass} type="tel" value={client.phone} onChange={(e) => updateClient("phone", e.target.value)} autoComplete="tel" /></Field><Field label="Service address" required><div className="relative"><MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className={`${inputClass} pl-9`} value={client.address} onChange={(e) => updateClient("address", e.target.value)} autoComplete="street-address" /></div></Field><Field label="Preferred date" required><div className="relative"><CalendarDays className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className={`${inputClass} pl-9`} type="date" min={new Date().toISOString().slice(0, 10)} value={client.preferredDate} onChange={(e) => updateClient("preferredDate", e.target.value)} /></div></Field><Field label="Preferred time"><select className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={client.timeWindow} onChange={(e) => updateClient("timeWindow", e.target.value)}><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select></Field></div><Field label="Notes"><Textarea value={client.notes} onChange={(e) => updateClient("notes", e.target.value)} placeholder="Anything else we should know?" /></Field><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><Button variant="ghost" onClick={() => setStep(2)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button><Button onClick={submit} disabled={pending}>{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send request</Button></div></div>}
  </section>
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <div className="flex flex-col gap-2"><Label>{label}{required && <span className="text-destructive"> *</span>}</Label>{children}</div> }
