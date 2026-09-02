"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

import { defaultPricingSettings, type PricingSettings, type QuoteResults } from "@/lib/pricing"

// Re-export so existing imports keep working; the canonical definitions live in lib/pricing.ts
export type { PricingSettings, QuoteResults }
export const defaultSettings: PricingSettings = defaultPricingSettings

export interface HomeDetails {
  squareFootage: string
  cleanLevel: string
  bedrooms: string
  bathrooms: string
  pets: string
  children: string
}

export const defaultHomeDetails: HomeDetails = {
  squareFootage: "",
  cleanLevel: "2",
  bedrooms: "",
  bathrooms: "",
  pets: "0",
  children: "0",
}

interface PricingSettingsContextValue {
  settings: PricingSettings
  updateSettings: (s: PricingSettings) => void
  resetToDefaults: () => void
  isLoaded: boolean
  homeDetails: HomeDetails
  updateHomeDetails: (d: Partial<HomeDetails>) => void
  quoteResults: QuoteResults | null
  updateQuoteResults: (r: QuoteResults | null) => void
  quotesUsed: number
  incrementQuotesUsed: () => void
  clearUserCache: () => void
}

const PricingSettingsContext = createContext<PricingSettingsContextValue | undefined>(undefined)

// Build localStorage key scoped to a specific user ID
function key(userId: string, name: string) {
  return `cqp_${userId}_${name}`
}

function readStorage<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k)
    if (raw) return JSON.parse(raw) as T
  } catch {
    // ignore
  }
  return fallback
}

function writeStorage(k: string, value: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(value))
  } catch {
    // ignore
  }
}

function removeStorage(k: string) {
  try { localStorage.removeItem(k) } catch { /* ignore */ }
}

// Remove all old non-scoped legacy keys left from previous implementation
function clearLegacyKeys() {
  const legacy = [
    "cqp_pricing_settings",
    "cqp_home_details",
    "cqp_quote_results",
    "cqp_quotes_used",
    "cqp_last_quote",
  ]
  legacy.forEach(k => removeStorage(k))
}

export function PricingSettingsProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [settings, setSettings] = useState<PricingSettings>(defaultSettings)
  const [homeDetails, setHomeDetails] = useState<HomeDetails>(defaultHomeDetails)
  const [quoteResults, setQuoteResults] = useState<QuoteResults | null>(null)
  const [quotesUsed, setQuotesUsed] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const prevUserIdRef = useRef<string | null>(null)

  // On mount: clear legacy keys, then listen for auth changes
  useEffect(() => {
    clearLegacyKeys()

    const supabase = createClient()

    const loadForUser = (uid: string) => {
      setSettings({ ...defaultSettings, ...readStorage(key(uid, "pricing_settings"), {}) })
      setHomeDetails({ ...defaultHomeDetails, ...readStorage(key(uid, "home_details"), {}) })
      setQuoteResults(readStorage<QuoteResults | null>(key(uid, "quote_results"), null))
      setQuotesUsed(readStorage<number>(key(uid, "quotes_used"), 0))
      setIsLoaded(true)
    }

    const resetState = () => {
      setSettings(defaultSettings)
      setHomeDetails(defaultHomeDetails)
      setQuoteResults(null)
      setQuotesUsed(0)
      setIsLoaded(true)
    }

    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null
      setUserId(uid)
      prevUserIdRef.current = uid
      if (uid) {
        loadForUser(uid)
      } else {
        resetState()
      }
    })

    // Watch for auth changes (login, logout, user switch)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null

      // If user changed (different account or logged out), reset all state
      if (uid !== prevUserIdRef.current) {
        prevUserIdRef.current = uid
        setUserId(uid)
        if (uid) {
          loadForUser(uid)
        } else {
          resetState()
        }
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const updateSettings = (s: PricingSettings) => {
    setSettings(s)
    if (userId) writeStorage(key(userId, "pricing_settings"), s)
  }

  const resetToDefaults = () => {
    setSettings(defaultSettings)
    if (userId) removeStorage(key(userId, "pricing_settings"))
  }

  const updateHomeDetails = (d: Partial<HomeDetails>) => {
    setHomeDetails(prev => {
      const next = { ...prev, ...d }
      if (userId) writeStorage(key(userId, "home_details"), next)
      return next
    })
  }

  const updateQuoteResults = (r: QuoteResults | null) => {
    setQuoteResults(r)
    if (userId) {
      if (r) {
        writeStorage(key(userId, "quote_results"), r)
      } else {
        removeStorage(key(userId, "quote_results"))
      }
    }
  }

  const incrementQuotesUsed = () => {
    setQuotesUsed(prev => {
      const next = prev + 1
      if (userId) writeStorage(key(userId, "quotes_used"), next)
      return next
    })
  }

  // Call this on logout before redirecting
  const clearUserCache = () => {
    if (userId) {
      removeStorage(key(userId, "pricing_settings"))
      removeStorage(key(userId, "home_details"))
      removeStorage(key(userId, "quote_results"))
      removeStorage(key(userId, "quotes_used"))
    }
    setSettings(defaultSettings)
    setHomeDetails(defaultHomeDetails)
    setQuoteResults(null)
    setQuotesUsed(0)
  }

  return (
    <PricingSettingsContext.Provider value={{
      settings, updateSettings, resetToDefaults, isLoaded,
      homeDetails, updateHomeDetails,
      quoteResults, updateQuoteResults,
      quotesUsed, incrementQuotesUsed,
      clearUserCache,
    }}>
      {children}
    </PricingSettingsContext.Provider>
  )
}

const fallbackContext: PricingSettingsContextValue = {
  settings: defaultSettings,
  updateSettings: () => {},
  resetToDefaults: () => {},
  isLoaded: false,
  homeDetails: defaultHomeDetails,
  updateHomeDetails: () => {},
  quoteResults: null,
  updateQuoteResults: () => {},
  quotesUsed: 0,
  incrementQuotesUsed: () => {},
  clearUserCache: () => {},
}

export function usePricingSettings() {
  const ctx = useContext(PricingSettingsContext)
  // Return a safe no-op fallback instead of throwing — prevents crashes on
  // pages that include Header (e.g. /pricing) where the context tree may not
  // have hydrated yet on the server render pass.
  return ctx ?? fallbackContext
}
