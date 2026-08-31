"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AddressParts {
  street: string
  city: string
  state: string
  zip: string
}

interface Props {
  id?: string
  value: string
  onChange: (value: string) => void
  onSelectParts?: (parts: AddressParts) => void
  placeholder?: string
  required?: boolean
  className?: string
}

declare global {
  interface Window {
    __mapsLoaded?: boolean
    __mapsLoadCallbacks?: (() => void)[]
    initGoogleMaps?: () => void
    google: typeof google
  }
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    if (window.__mapsLoaded || window.google?.maps?.places) { window.__mapsLoaded = true; resolve(); return }
    if (!window.__mapsLoadCallbacks) window.__mapsLoadCallbacks = []
    window.__mapsLoadCallbacks.push(resolve)
    const existing = document.querySelector('script[data-gm-places]')
    if (existing) {
      existing.addEventListener("load", () => { window.__mapsLoaded = true; window.__mapsLoadCallbacks?.forEach(cb => cb()); window.__mapsLoadCallbacks = [] }, { once: true })
      return
    }
    window.initGoogleMaps = () => {
      window.__mapsLoaded = true
      window.__mapsLoadCallbacks?.forEach(cb => cb())
      window.__mapsLoadCallbacks = []
    }
    const script = document.createElement("script")
    script.setAttribute("data-gm-places", "1")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  })
}

interface Suggestion {
  placeId: string
  description: string
  mainText: string      // street only, e.g. "2700 Cove Cay Drive"
  secondaryText: string // city, state, e.g. "Clearwater, FL, USA"
}

// Hidden div used as the map anchor PlacesService requires
let placesServiceEl: HTMLDivElement | null = null
function getPlacesService(): google.maps.places.PlacesService {
  if (!placesServiceEl) {
    placesServiceEl = document.createElement("div")
    document.body.appendChild(placesServiceEl)
  }
  return new window.google.maps.places.PlacesService(placesServiceEl)
}

export function AddressAutocomplete({ id, value, onChange, onSelectParts, placeholder, required, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [inputVal, setInputVal] = useState(value)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const skipSyncRef = useRef(false)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  // Only sync from parent if the change didn't originate from a selection
  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false
      return
    }
    setInputVal(value)
  }, [value])

  const fetchSuggestions = useCallback((input: string) => {
    if (!serviceRef.current || input.length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }
    serviceRef.current.getPlacePredictions(
      { input, types: ["address"], componentRestrictions: { country: "us" } },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions.map(p => ({
            placeId: p.place_id,
            description: p.description,
            mainText: p.structured_formatting.main_text,
            secondaryText: p.structured_formatting.secondary_text,
          })))
          setOpen(true)
          setActiveIdx(-1)
        } else {
          setSuggestions([])
          setOpen(false)
        }
      }
    )
  }, [])

  useEffect(() => {
    if (!apiKey) return
    loadGoogleMaps(apiKey).then(() => {
      serviceRef.current = new window.google.maps.places.AutocompleteService()
      if (inputVal.length >= 3) fetchSuggestions(inputVal)
    })
  }, [apiKey])

  const handleSelect = (s: Suggestion) => {
    const streetOnly = s.mainText

    skipSyncRef.current = true
    setInputVal(streetOnly)
    onChange(streetOnly)
    setSuggestions([])
    setOpen(false)

    if (!onSelectParts) return

    // Use PlacesService.getDetails to get full address_components including zip
    const svc = getPlacesService()
    svc.getDetails(
      { placeId: s.placeId, fields: ["address_components"] },
      (place, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place?.address_components) {
          // Fallback: parse city/state from secondaryText "Clearwater, FL, USA"
          const parts = s.secondaryText.split(",").map(x => x.trim())
          const city = parts[0] ?? ""
          const stateZipRaw = (parts[1] ?? "").replace(/USA$/i, "").trim()
          const match = stateZipRaw.match(/^([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?$/)
          onSelectParts({ street: streetOnly, city, state: match?.[1] ?? stateZipRaw, zip: match?.[2] ?? "" })
          return
        }
        const get = (type: string) =>
          place.address_components!.find(c => c.types.includes(type))?.long_name ?? ""
        const getShort = (type: string) =>
          place.address_components!.find(c => c.types.includes(type))?.short_name ?? ""
        onSelectParts({
          street: streetOnly,
          city: get("locality") || get("sublocality") || get("neighborhood"),
          state: getShort("administrative_area_level_1"),
          zip: get("postal_code"),
        })
      }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault()
      handleSelect(suggestions[activeIdx])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  // Close dropdown on click outside the container
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={inputVal}
        onChange={e => {
          setInputVal(e.target.value)
          onChange(e.target.value)
          fetchSuggestions(e.target.value)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "e.g. 123 Main St, Miami FL"}
        required={required}
        autoComplete="off"
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-[9999] mt-1 w-full rounded-md border border-border bg-popover shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <li
              key={s.placeId}
              onMouseDown={e => {
                e.preventDefault() // prevent input blur
                handleSelect(s)
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer select-none",
                i === activeIdx ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="font-medium">{s.mainText}</span>
              <span className="text-muted-foreground text-xs truncate">{s.secondaryText}</span>
            </li>
          ))}
          <li className="flex justify-end px-3 py-1 border-t border-border">
            <img src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png" alt="Powered by Google" className="h-4" />
          </li>
        </ul>
      )}
    </div>
  )
}
