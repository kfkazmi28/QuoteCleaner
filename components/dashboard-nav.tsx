"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sparkles, Menu, X, Moon, Sun, ChevronDown, Users, Settings, Tag, User, LogOut } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { usePricingSettings } from "@/contexts/pricing-settings-context"
import { COMPANY_NAME } from "@/lib/company-config"

export function DashboardNav() {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const { clearUserCache } = usePricingSettings()

  const handleLogout = async () => {
    clearUserCache()
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (!error) {
      window.location.href = "/"
    }
  }

  const navLinks = [
    { href: "/dashboard/calculator", label: "Calculator" },
    { href: "/dashboard/quotes", label: "Saved Quotes" },
    { href: "/dashboard/calendar", label: "Calendar" },
    { href: "/dashboard/contacts", label: "Contacts" },
    { href: "/dashboard/invoices", label: "Invoices" },
    { href: "/dashboard/communications/templates", label: "Communications", match: "/dashboard/communications" },
  ]
  const isActive = (l: { href: string; match?: string }) =>
    l.match ? pathname.startsWith(l.match) : pathname === l.href

  const menuLinks = [
    { href: "/dashboard/team", label: "Team", icon: Users },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
    { href: "/pricing", label: "Pricing", icon: Tag },
    { href: "/account", label: "Account", icon: User },
  ]

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <header aria-label="Dashboard navigation" className="dashboard-sidebar sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md md:fixed md:inset-y-0 md:left-0 md:flex md:w-64 md:flex-col md:border-b-0 md:border-r">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 md:w-full md:max-w-none md:flex-col md:items-stretch md:gap-8 md:px-5 md:py-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-foreground">{COMPANY_NAME}</span>
        </Link>

        {isLoggedIn && (
          <nav className="hidden flex-col gap-1 md:flex">
            <Link
              href="/dashboard"
              className={cn(
                "rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-accent hover:text-primary",
                pathname === "/dashboard" ? "bg-accent text-primary" : "text-foreground",
              )}
            >
              Dashboard
            </Link>
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-primary",
                  isActive(l) ? "text-primary" : "text-muted-foreground",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="hidden items-center gap-2 md:flex">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:block" />
          </button>

          {isLoggedIn === false ? (
            /* Guest — show Sign Up button */
            <Button size="sm" asChild>
              <Link href="/login">Sign Up</Link>
            </Button>
          ) : isLoggedIn === true ? (
            /* Logged in — show user dropdown */
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(v => !v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  dropdownOpen ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <User className="h-4 w-4" />
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", dropdownOpen && "rotate-180")} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-44 rounded-lg border border-border bg-popover shadow-md py-1 z-50">
                  {menuLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setDropdownOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                        pathname === l.href ? "text-primary font-medium" : "text-foreground"
                      )}
                    >
                      <l.icon className="h-4 w-4 text-muted-foreground" />
                      {l.label}
                    </Link>
                  ))}
                  <div className="my-1 border-t border-border" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-destructive transition-colors hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {isLoggedIn ? (
              <>
                {[...navLinks, ...menuLinks].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      isActive(l) ? "text-primary bg-accent/50" : "text-muted-foreground",
                    )}
                  >
                    {l.label}
                  </Link>
                ))}
                <div className="my-1 border-t border-border" />
                <button
                  onClick={handleLogout}
                  className="rounded-md px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-accent"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Sign Up
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
