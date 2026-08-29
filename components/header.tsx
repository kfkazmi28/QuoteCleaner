"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Sparkles, Menu, X, Moon, Sun } from "lucide-react"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { QuoteCalculator } from "@/components/quote-calculator"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { usePricingSettings } from "@/contexts/pricing-settings-context"

export function Header() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
    })

    // Keep in sync with auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const { clearUserCache } = usePricingSettings()

  const handleSignOut = async () => {
    clearUserCache()
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (!error) {
      window.location.href = "/"
    }
  }

  const publicLinks = [
    { href: "/", label: "Home" },
    { href: "/quote", label: "Calculator" },
    { href: "/pricing", label: "Pricing" },
    { href: "/resources", label: "Resources" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo — never logs out, only navigates */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold sm:text-base">QuoteCleaner</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {publicLinks.map((l) => l.label === "Calculator" ? (
            <Popover key={l.href}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === l.href ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {l.label}
                </button>
              </PopoverTrigger>
              <PopoverContent align="center" className="w-[min(92vw,520px)] max-h-[calc(100vh-5rem)] overflow-y-auto p-0">
                <QuoteCalculator />
              </PopoverContent>
            </Popover>
          ) : (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === l.href ? "text-primary" : "text-muted-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop auth actions */}
        <div className="hidden items-center gap-2 md:flex">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:block" />
          </button>

          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/account">Account</Link>
              </Button>
              <Button size="sm" variant="outline" onClick={handleSignOut}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:block" />
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {publicLinks.map((l) => l.label === "Calculator" ? (
              <Popover key={l.href}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "text-left text-sm font-medium transition-colors hover:text-primary",
                      pathname === l.href ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {l.label}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[min(92vw,520px)] max-h-[calc(100vh-7rem)] overflow-y-auto p-0">
                  <QuoteCalculator />
                </PopoverContent>
              </Popover>
            ) : (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === l.href ? "text-primary" : "text-muted-foreground",
                )}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              {user ? (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/account" onClick={() => setOpen(false)}>Account</Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleSignOut}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/login" onClick={() => setOpen(false)}>Login</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
