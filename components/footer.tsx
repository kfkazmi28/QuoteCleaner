import Link from "next/link"
import { Sparkles } from "lucide-react"
import { COMPANY_NAME, SUPPORT_EMAIL, WEBSITE_URL } from "@/lib/company-config"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-bold">{COMPANY_NAME}</span>
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </Link>
          <Link href="/resources" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Resources
          </Link>
          <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Login
          </Link>
          <Link href="/terms" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Terms
          </Link>
          <Link href="/privacy" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Privacy
          </Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Contact
          </a>
        </nav>

        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {COMPANY_NAME}
        </p>
      </div>
    </footer>
  )
}
