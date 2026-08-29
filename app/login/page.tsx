"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Sparkles, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") || "/dashboard"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
      toast.success("Welcome back!")
      router.refresh()
      router.push(redirectTo)
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }

      // ✅ send notification
      await fetch("/api/notify-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      toast.success("Account created! Check your email to confirm.")
      router.refresh()
      router.push(redirectTo)
    }

    setLoading(false)
  }

  return (
    <div className="w-full max-w-md">
      {/* Mobile logo */}
      <Link href="/" className="mb-8 flex items-center justify-center gap-2 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="font-bold text-foreground">CleanQuote Pro</span>
      </Link>

      {/* Tab toggle */}
      <div className="mb-8 flex rounded-xl border border-border bg-muted p-1">
        <button
          onClick={() => setMode("login")}
          className={cn(
            "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
            mode === "login"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Log In
        </button>
        <button
          onClick={() => setMode("signup")}
          className={cn(
            "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
            mode === "signup"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Sign Up
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login"
            ? "Enter your credentials to access your dashboard."
            : "Start quoting cleaning jobs in 30 seconds."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {mode === "login" && (
              <button type="button" className="text-xs text-primary hover:underline">
                Forgot password?
              </button>
            )}
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="mt-2 w-full" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Log In" : "Sign Up"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {mode === "login" ? "Don\u2019t have an account?" : "Already have an account?"}{" "}
        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="text-primary hover:underline"
        >
          {mode === "login" ? "Sign up free" : "Log in"}
        </button>
      </p>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="text-primary hover:underline">Terms</Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
      </p>
    </div>
  )
}

const benefits = [
  "Quote any job in 30 seconds",
  "6 pricing tiers generated instantly",
  "Works on any device, anywhere",
  "Built by a real cleaning company owner",
]

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left branding panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 lg:flex lg:w-[45%]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_20%,oklch(1_0_0/0.08),transparent)]"
        />

        <Link href="/" className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/10 ring-1 ring-primary-foreground/20">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-primary-foreground">CleanQuote Pro</span>
        </Link>

        <div className="relative">
          <h1 className="text-3xl font-bold leading-tight text-primary-foreground xl:text-4xl">
            Price confidently.<br />
            Grow your business.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-primary-foreground/80">
            Stop undercharging. Start quoting like a pro with our instant cleaning calculator.
          </p>

          <ul className="mt-8 flex flex-col gap-3">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-3 text-sm text-primary-foreground/90">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px] font-bold text-primary-foreground">
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>

          <blockquote className="mt-10 rounded-xl bg-primary-foreground/10 p-4 ring-1 ring-primary-foreground/10">
            <p className="text-sm italic leading-relaxed text-primary-foreground/90">
              &ldquo;CleanQuote Pro helped me raise my rates by 30% and my clients never questioned it.&rdquo;
            </p>
            <footer className="mt-2 text-xs text-primary-foreground/70">— Maria S., Austin TX</footer>
          </blockquote>
        </div>

        <p className="relative text-xs text-primary-foreground/50">
          &copy; {new Date().getFullYear()} CleanQuote Pro
        </p>
      </div>

      {/* Right auth panel */}
      <div className="flex flex-1 items-center justify-center bg-background px-4 py-12 sm:px-8">
        <Suspense fallback={<div className="w-full max-w-md animate-pulse"><div className="h-96 rounded-lg bg-muted" /></div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
