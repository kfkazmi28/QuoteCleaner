"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Plus, Copy, ExternalLink, Pencil, Trash2, Link2, Inbox, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePricingSettings } from "@/contexts/pricing-settings-context"
import type { SavedCalculator } from "@/app/actions/calculators"
import { createBookingForm, updateBookingForm, deleteBookingForm } from "@/app/actions/booking-forms"
import type { BookingForm } from "@/lib/booking-forms"
import { slugify } from "@/lib/booking-forms"
import type { PricingSettings } from "@/lib/pricing"
import { cn } from "@/lib/utils"

const CURRENT = "__current__"

interface Props {
  initialForms: BookingForm[]
  calculators: SavedCalculator[]
  loadError?: string
}

export function BookingFormsManager({ initialForms, calculators, loadError }: Props) {
  const [forms, setForms] = useState(initialForms)
  const [editing, setEditing] = useState<BookingForm | null | "new">(null)
  const [deleting, setDeleting] = useState<BookingForm | null>(null)
  const [pending, startTransition] = useTransition()

  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const shareUrl = (f: BookingForm) => `${origin}/book/${f.slug}`

  function copyLink(f: BookingForm) {
    navigator.clipboard.writeText(shareUrl(f)).then(
      () => toast.success("Link copied"),
      () => toast.error("Couldn't copy link"),
    )
  }

  function toggleActive(f: BookingForm, next: boolean) {
    setForms((prev) => prev.map((x) => (x.id === f.id ? { ...x, is_active: next } : x)))
    startTransition(async () => {
      const { error } = await updateBookingForm(f.id, { is_active: next })
      if (error) {
        toast.error(error)
        setForms((prev) => prev.map((x) => (x.id === f.id ? { ...x, is_active: !next } : x)))
      }
    })
  }

  function confirmDelete() {
    if (!deleting) return
    const target = deleting
    startTransition(async () => {
      const { error } = await deleteBookingForm(target.id)
      if (error) {
        toast.error(error)
        return
      }
      setForms((prev) => prev.filter((x) => x.id !== target.id))
      setDeleting(null)
      toast.success("Booking form deleted")
    })
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Could not load booking forms: {loadError}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {forms.length === 0 ? "No forms yet" : `${forms.length} form${forms.length === 1 ? "" : "s"}`}
        </p>
        <Button onClick={() => setEditing("new")}>
          <Plus className="mr-2 h-4 w-4" />
          New booking form
        </Button>
      </div>

      {forms.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Link2 className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-foreground">Create your first booking form</h2>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Clients enter their home details, see instant pricing from your calculator settings, and request a date.
              Requests land in Saved Quotes.
            </p>
          </div>
          <Button onClick={() => setEditing("new")}>
            <Plus className="mr-2 h-4 w-4" />
            New booking form
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {forms.map((f) => (
            <li
              key={f.id}
              className={cn(
                "flex flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-colors sm:flex-row sm:items-center sm:justify-between",
                !f.is_active && "opacity-70",
              )}
            >
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-foreground">{f.name}</h3>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      f.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {f.is_active ? "Live" : "Paused"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="font-mono">/book/{f.slug}</span>
                  <span className="flex items-center gap-1">
                    <Inbox className="h-3.5 w-3.5" />
                    {f.submissions_count} request{f.submissions_count === 1 ? "" : "s"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calculator className="h-3.5 w-3.5" />
                    ${f.settings_snapshot.hourlyRate}/hr
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="mr-2 flex items-center gap-2">
                  <Switch
                    id={`active-${f.id}`}
                    checked={f.is_active}
                    onCheckedChange={(v) => toggleActive(f, v)}
                    aria-label={f.is_active ? "Pause form" : "Activate form"}
                  />
                  <Label htmlFor={`active-${f.id}`} className="text-xs text-muted-foreground">
                    {f.is_active ? "Accepting" : "Paused"}
                  </Label>
                </div>
                <Button variant="outline" size="sm" onClick={() => copyLink(f)}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copy link
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/book/${f.slug}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Preview
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setEditing(f)} aria-label="Edit form">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleting(f)}
                  aria-label="Delete form"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <FormEditor
          form={editing === "new" ? null : editing}
          calculators={calculators}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setForms((prev) => {
              const exists = prev.some((x) => x.id === saved.id)
              return exists ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev]
            })
            setEditing(null)
          }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleting?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              The share link will stop working immediately. Requests already saved to your quotes are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={pending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function FormEditor({
  form,
  calculators,
  onClose,
  onSaved,
}: {
  form: BookingForm | null
  calculators: SavedCalculator[]
  onClose: () => void
  onSaved: (f: BookingForm) => void
}) {
  const { settings: currentSettings } = usePricingSettings()
  const [pending, startTransition] = useTransition()

  const [name, setName] = useState(form?.name ?? "")
  const [slug, setSlug] = useState(form?.slug ?? "")
  const [slugTouched, setSlugTouched] = useState(!!form)
  const [title, setTitle] = useState(form?.title ?? "Get an instant cleaning quote")
  const [intro, setIntro] = useState(form?.intro ?? "")
  const [businessName, setBusinessName] = useState(form?.business_name ?? "")
  const [source, setSource] = useState<string>(form?.source_calculator_id ?? CURRENT)

  const selectedSettings: PricingSettings =
    source === CURRENT
      ? currentSettings
      : calculators.find((c) => c.id === source)?.settings ?? form?.settings_snapshot ?? currentSettings

  function handleName(v: string) {
    setName(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  function save() {
    if (!name.trim()) {
      toast.error("Give the form a name")
      return
    }
    startTransition(async () => {
      const payload = {
        name,
        slug,
        title,
        intro,
        business_name: businessName,
        settings_snapshot: selectedSettings,
        source_calculator_id: source === CURRENT ? null : source,
      }
      const res = form ? await updateBookingForm(form.id, payload) : await createBookingForm(payload)
      if (res.error || !res.data) {
        toast.error(res.error ?? "Something went wrong")
        return
      }
      toast.success(form ? "Booking form updated" : "Booking form created")
      onSaved(res.data)
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{form ? "Edit booking form" : "New booking form"}</DialogTitle>
          <DialogDescription>
            Choose which pricing the form uses and how it introduces itself to clients.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="bf-name">Internal name</Label>
            <Input id="bf-name" value={name} onChange={(e) => handleName(e.target.value)} placeholder="e.g. Website booking" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="bf-slug">Link</Label>
            <div className="flex items-center rounded-md border border-input bg-background text-sm focus-within:ring-2 focus-within:ring-ring">
              <span className="shrink-0 pl-3 text-muted-foreground">/book/</span>
              <input
                id="bf-slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(slugify(e.target.value))
                }}
                className="h-9 w-full bg-transparent px-1 pr-3 outline-none"
                placeholder="your-link"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="bf-source">Pricing settings</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger id="bf-source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CURRENT}>Current settings (${currentSettings.hourlyRate}/hr)</SelectItem>
                {calculators.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} (${c.settings.hourlyRate}/hr)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs leading-5 text-muted-foreground">
              A snapshot is saved with the form. Edit the form later to refresh it if your settings change.
            </p>
          </div>

          <div className="h-px bg-border" />

          <div className="flex flex-col gap-2">
            <Label htmlFor="bf-business">Business name shown to clients</Label>
            <Input id="bf-business" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Sparkle Cleaning Co." />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="bf-title">Headline</Label>
            <Input id="bf-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="bf-intro">Intro (optional)</Label>
            <Textarea
              id="bf-intro"
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={3}
              placeholder="Tell us about your home and we'll show your price right away."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? "Saving…" : form ? "Save changes" : "Create form"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
