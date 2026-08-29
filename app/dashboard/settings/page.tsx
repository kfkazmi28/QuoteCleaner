"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardNav } from "@/components/dashboard-nav"
import { usePricingSettings, defaultSettings, type PricingSettings } from "@/contexts/pricing-settings-context"
import { RotateCcw, Save, Clock, DollarSign, Percent, Car, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface SettingFieldProps {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  suffix?: string
  step?: string
  min?: number
  description?: string
}

function SettingField({ id, label, value, onChange, suffix, step = "1", min = 0, description }: SettingFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          step={step}
          min={min}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={suffix ? "pr-12" : ""}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

export default function PricingSettingsPage() {
  const { settings, updateSettings, resetToDefaults, isLoaded } = usePricingSettings()
  const [localSettings, setLocalSettings] = useState<PricingSettings>(settings)
  const [hasChanges, setHasChanges] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (isLoaded) {
      setLocalSettings(settings)
    }
  }, [settings, isLoaded])

  useEffect(() => {
    const changed = JSON.stringify(localSettings) !== JSON.stringify(settings)
    setHasChanges(changed)
  }, [localSettings, settings])

  const handleChange = (key: keyof PricingSettings, value: number) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    updateSettings(localSettings)
    toast.success("Pricing settings updated")
    router.push("/dashboard")
  }

  const handleReset = () => {
    setLocalSettings(defaultSettings)
    resetToDefaults()
    toast.success("Settings reset to defaults")
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-muted/30">
        <DashboardNav />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Calculator
        </Link>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Pricing Settings</h1>
            <p className="mt-1 text-muted-foreground">
              Customize your quote calculation variables
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Reset to Defaults</span>
              <span className="sm:hidden">Reset</span>
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges} className="gap-2">
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Save Changes</span>
              <span className="sm:hidden">Save</span>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Base Rates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-primary" />
                Base Rates
              </CardTitle>
              <CardDescription>Set your hourly rate and minimum pricing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingField
                id="hourlyRate"
                label="Hourly Rate"
                value={localSettings.hourlyRate}
                onChange={(v) => handleChange("hourlyRate", v)}
                suffix="$/hr"
                description="Your base hourly rate for cleaning services"
              />
              <SettingField
                id="minimumQuotePrice"
                label="Minimum Quote Price"
                value={localSettings.minimumQuotePrice}
                onChange={(v) => handleChange("minimumQuotePrice", v)}
                suffix="$"
                description="The lowest price you'll quote for any job"
              />
              <SettingField
                id="travelFee"
                label="Travel Fee"
                value={localSettings.travelFee}
                onChange={(v) => handleChange("travelFee", v)}
                suffix="$"
                description="Additional fee added to each quote for travel"
              />
            </CardContent>
          </Card>

          {/* Time Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                Time Variables
              </CardTitle>
              <CardDescription>Minutes added per room or condition</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingField
                id="bedroomMinutes"
                label="Bedroom Minutes"
                value={localSettings.bedroomMinutes}
                onChange={(v) => handleChange("bedroomMinutes", v)}
                suffix="min"
                description="Minutes added per bedroom"
              />
              <SettingField
                id="bathroomMinutes"
                label="Bathroom Minutes"
                value={localSettings.bathroomMinutes}
                onChange={(v) => handleChange("bathroomMinutes", v)}
                suffix="min"
                description="Minutes added per bathroom"
              />
              <SettingField
                id="petFeeMinutes"
                label="Pet Fee Minutes"
                value={localSettings.petFeeMinutes}
                onChange={(v) => handleChange("petFeeMinutes", v)}
                suffix="min"
                description="Extra minutes added per pet"
              />
              <SettingField
                id="childrenFeeMinutes"
                label="Children Fee Minutes"
                value={localSettings.childrenFeeMinutes}
                onChange={(v) => handleChange("childrenFeeMinutes", v)}
                suffix="min"
                description="Extra minutes added per child"
              />
            </CardContent>
          </Card>

          {/* Square Footage & Move-In */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Car className="h-5 w-5 text-primary" />
                Size &amp; Special Jobs
              </CardTitle>
              <CardDescription>Configure square footage and move-in/out settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingField
                id="sqftMultiplier"
                label="Square Footage Multiplier"
                value={localSettings.sqftMultiplier}
                onChange={(v) => handleChange("sqftMultiplier", v)}
                step="0.001"
                description="Minutes per square foot (e.g., 0.05 = 1 min per 20 sqft)"
              />
              <SettingField
                id="moveInExtraHours"
                label="Move-In/Out Extra Hours"
                value={localSettings.moveInExtraHours}
                onChange={(v) => handleChange("moveInExtraHours", v)}
                suffix="hrs"
                step="0.5"
                description="Extra hours added for move-in/out cleanings"
              />
            </CardContent>
          </Card>

          {/* Discounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Percent className="h-5 w-5 text-primary" />
                Discounts
              </CardTitle>
              <CardDescription>Set discount percentages for recurring services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingField
                id="standardCleanDiscount"
                label="Standard Clean Discount"
                value={localSettings.standardCleanDiscount}
                onChange={(v) => handleChange("standardCleanDiscount", v)}
                suffix="%"
                description="Discount from deep clean price for standard cleans"
              />
              <SettingField
                id="monthlyDiscount"
                label="Monthly Recurring Discount"
                value={localSettings.monthlyDiscount}
                onChange={(v) => handleChange("monthlyDiscount", v)}
                suffix="%"
                description="Additional discount for monthly recurring clients"
              />
              <SettingField
                id="biweeklyDiscount"
                label="Biweekly Recurring Discount"
                value={localSettings.biweeklyDiscount}
                onChange={(v) => handleChange("biweeklyDiscount", v)}
                suffix="%"
                description="Additional discount for biweekly recurring clients"
              />
              <SettingField
                id="weeklyDiscount"
                label="Weekly Recurring Discount"
                value={localSettings.weeklyDiscount}
                onChange={(v) => handleChange("weeklyDiscount", v)}
                suffix="%"
                description="Additional discount for weekly recurring clients"
              />
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  )
}
