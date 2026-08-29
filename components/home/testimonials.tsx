import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Maria S.",
    role: "Solo Cleaner, Austin TX",
    body: "I was undercharging for years. CleanQuote Pro helped me raise my rates by 30% overnight and clients didn't even blink.",
    rating: 5,
  },
  {
    name: "Jessica R.",
    role: "Owner, Sparkle Cleaning Co.",
    body: "My team uses this on every job walkthrough. It looks so professional and saves us from awkward price negotiations.",
    rating: 5,
  },
  {
    name: "Dana K.",
    role: "House Cleaner, 3 years exp.",
    body: "Finally a tool built for cleaners! I quote from my phone before I even leave the client's driveway.",
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section className="relative overflow-hidden border-t border-brand-blue/20 bg-background/90 py-16 sm:py-20">
      <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-brand-pink/15 blur-3xl" />
      <div className="pointer-events-none absolute right-10 top-8 h-40 w-40 rounded-full bg-brand-pink/10 blur-3xl" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            What Cleaners Are Saying
          </h2>
          <p className="mt-3 text-muted-foreground">Real results from real cleaning professionals</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl border border-brand-pink/20 bg-card p-6 shadow-sm"
            >
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-brand-pink text-brand-pink" />
                ))}
              </div>
              <blockquote className="mb-4 text-sm leading-relaxed text-card-foreground">
                &ldquo;{t.body}&rdquo;
              </blockquote>
              <figcaption>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
