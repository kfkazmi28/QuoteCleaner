"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { acceptTeamInvite } from "@/app/actions/team"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2, Users } from "lucide-react"
import Link from "next/link"

function InviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [state, setState] = useState<"loading" | "needs-login" | "accepting" | "success" | "error">("loading")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (!token) {
      setState("error")
      setErrorMsg("Invalid invite link — no token found.")
      return
    }

    // Check if user is already logged in
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setState("needs-login")
      } else {
        setState("accepting")
        acceptTeamInvite(token).then(({ error }) => {
          if (error) {
            setErrorMsg(error)
            setState("error")
          } else {
            setState("success")
            setTimeout(() => router.push("/dashboard"), 2500)
          }
        })
      }
    })
  }, [token, router])

  return (
    <div className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "linear-gradient(160deg, oklch(0.93 0.05 175) 0%, oklch(0.98 0.01 175) 55%, #ffffff 100%)" }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-8 shadow-lg text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "oklch(0.60 0.15 175 / 0.10)" }}>
          <Users className="h-6 w-6" style={{ color: "oklch(0.52 0.14 175)" }} />
        </div>

        <h1 className="text-lg font-bold text-foreground">Team Invitation</h1>

        {state === "loading" && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Checking your invite...</p>
          </div>
        )}

        {state === "accepting" && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Accepting invite...</p>
          </div>
        )}

        {state === "needs-login" && (
          <div className="mt-4 flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              You need to log in (or create an account) to accept this invitation.
            </p>
            <Button asChild>
              <Link href={`/login?redirectTo=/invite?token=${token}`}>
                Log in to accept
              </Link>
            </Button>
          </div>
        )}

        {state === "success" && (
          <div className="mt-4 flex flex-col items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <p className="text-sm font-medium text-foreground">You&apos;ve joined the team!</p>
            <p className="text-xs text-muted-foreground">Redirecting to your dashboard...</p>
            <Button asChild className="mt-2">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        )}

        {state === "error" && (
          <div className="mt-4 flex flex-col items-center gap-3">
            <XCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium text-foreground">Could not accept invite</p>
            <p className="text-xs text-muted-foreground">{errorMsg}</p>
            <Button variant="outline" asChild className="mt-2">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense>
      <InviteContent />
    </Suspense>
  )
}
