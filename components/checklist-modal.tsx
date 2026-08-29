"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Pencil, Plus, Trash2 } from "lucide-react"

export type ChecklistSection = { section: string; items: string[] }

export const STANDARD_CLEAN_CHECKLIST: ChecklistSection[] = [
  {
    section: "Dust",
    items: [
      "Lighting Fixtures",
      "Vents",
      "TV & other monitors (not screens)",
      "Fans",
      "Door frames",
      "Picture frames & décor",
      "Tables & chairs",
      "Shelves",
      "Blinds",
    ],
  },
  {
    section: "Wipe Down",
    items: [
      "Kitchen counters",
      "Refrigerator (exterior)",
      "Table Tops",
      "Bathroom Counters",
      "Bathroom cabinets (exterior)",
      "Shower door",
      "Shower caddy / soap dish",
      "Bathroom mirror",
    ],
  },
  {
    section: "Scrub",
    items: [
      "Stovetop",
      "Kitchen sink",
      "Microwave (inside & out)",
      "Bathtub / shower",
      "Bathroom sinks",
      "Toilet",
    ],
  },
  {
    section: "Floors & Baseboards",
    items: ["Vacuum", "Dry mopping", "Wet mopping"],
  },
]

export const DEEP_CLEAN_CHECKLIST: ChecklistSection[] = [
  {
    section: "Dust",
    items: [
      "Vents",
      "TV & other monitors (not screens)",
      "Fans",
      "Door frames",
      "Picture frames & décor",
      "Tables & chairs",
      "Shelves",
      "Inside Window sills",
      "Blinds",
      "Upholstered furniture vacuumed",
    ],
  },
  {
    section: "Wipe Down",
    items: [
      "Kitchen counters",
      "Kitchen Cabinets (exterior)",
      "Refrigerator (exterior only)",
      "Microwave (inside & out)",
      "Table Tops",
      "Bathroom Counters",
      "Bathroom cabinets (exterior)",
      "Shower door",
      "Shower soap dish",
      "Bathroom mirror",
      "Trash cans (exterior)",
      "Inside Window sills",
      "Shelves",
    ],
  },
  {
    section: "Scrub",
    items: [
      "Stovetop",
      "Backsplash behind stove",
      "Kitchen sink",
      "Bathtub / shower",
      "Bathroom tiles",
      "Bathroom sinks",
      "Toilet",
    ],
  },
]

export const MOVE_IN_CHECKLIST: ChecklistSection[] = [
  {
    section: "Dust",
    items: [
      "Fans",
      "Lighting Fixtures",
      "Vents",
      "Door frames",
      "Tables & chairs",
      "Shelves",
      "Cobwebs removed",
      "Interior window sills",
    ],
  },
  {
    section: "Wipe Down",
    items: [
      "Kitchen counters",
      "Kitchen Cabinets (exterior & interior)",
      "Refrigerator (exterior, including top)",
      "Table Tops",
      "Bathroom Counters",
      "Bathrooms cabinets (exterior & interior)",
      "Shower door",
      "Bathroom mirror",
      "Window sills",
      "Blinds",
      "Shelves",
      "Trash cans (inside & out)",
    ],
  },
  {
    section: "Scrub",
    items: [
      "Stovetop",
      "Backsplash behind stove",
      "Kitchen sink",
      "Microwave (inside & out)",
      "Bathtub / shower",
      "Bathroom tiles",
      "Bathroom sinks",
      "Toilet",
      "Stain buildup",
    ],
  },
  {
    section: "Floors & Baseboards",
    items: ["Vacuum", "Dry mopping", "Wet mopping", "Wipe down baseboards"],
  },
  {
    section: "Extended time for areas of focus",
    items: [
      "Inside Oven",
      "Inside Fridge",
      "Inside cabinets",
      "Porch / Patio sweep",
    ],
  },
]

/** Map a package key to its default checklist */
export function getDefaultChecklist(packageKey: string): ChecklistSection[] {
  if (packageKey === "deep") return DEEP_CLEAN_CHECKLIST
  if (packageKey === "move") return MOVE_IN_CHECKLIST
  return STANDARD_CLEAN_CHECKLIST
}

/** Map a package key to its display title */
export function getChecklistTitle(packageKey: string): string {
  if (packageKey === "deep") return "Deep Clean Checklist"
  if (packageKey === "move") return "Move In / Move Out Checklist"
  return "Standard Cleaning Checklist"
}

/** Map a package key to its display description */
export function getChecklistDescription(packageKey: string): string {
  if (packageKey === "deep") return "Everything included in a deep clean"
  if (packageKey === "move") return "Everything included in a move in or move out clean"
  return "Everything included in a standard cleaning"
}

export function ChecklistModal({
  open,
  onClose,
  title,
  description,
  checklist,
  onSave,
}: {
  open: boolean
  onClose: () => void
  title: string
  description: string
  checklist: ChecklistSection[]
  onSave?: (updated: ChecklistSection[]) => void
}) {
  const [editing, setEditing] = useState(false)
  const [localList, setLocalList] = useState(checklist)
  const [newItemText, setNewItemText] = useState<Record<string, string>>({})

  useEffect(() => {
    setLocalList(checklist)
    setEditing(false)
    setNewItemText({})
  }, [checklist, open])

  const handleDeleteItem = (sectionIdx: number, itemIdx: number) => {
    setLocalList(prev =>
      prev.map((g, si) =>
        si === sectionIdx ? { ...g, items: g.items.filter((_, ii) => ii !== itemIdx) } : g
      )
    )
  }

  const handleAddItem = (sectionIdx: number) => {
    const text = (newItemText[sectionIdx] ?? "").trim()
    if (!text) return
    setLocalList(prev =>
      prev.map((g, si) =>
        si === sectionIdx ? { ...g, items: [...g.items, text] } : g
      )
    )
    setNewItemText(prev => ({ ...prev, [sectionIdx]: "" }))
  }

  const handleSave = () => {
    onSave?.(localList)
    setEditing(false)
  }

  const handleCancel = () => {
    setLocalList(checklist)
    setEditing(false)
    setNewItemText({})
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
              <DialogDescription className="mt-0.5 text-sm text-muted-foreground">
                {description}
              </DialogDescription>
            </div>
            {onSave && !editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="shrink-0">
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            {localList.map((group, sectionIdx) => (
              <div key={group.section}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
                  {group.section}
                </h3>
                <ul className="space-y-2">
                  {group.items.map((item, itemIdx) => (
                    <li key={`${sectionIdx}-${itemIdx}`} className="flex items-start gap-2.5 group">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-2.5 w-2.5 text-primary" />
                      </span>
                      <span className="flex-1 text-sm text-foreground">{item}</span>
                      {editing && (
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(sectionIdx, itemIdx)}
                          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label={`Delete ${item}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {editing && (
                  <div className="mt-3 flex gap-2">
                    <Input
                      placeholder="Add new item..."
                      value={newItemText[sectionIdx] ?? ""}
                      onChange={e => setNewItemText(prev => ({ ...prev, [sectionIdx]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && handleAddItem(sectionIdx)}
                      className="h-8 text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddItem(sectionIdx)}
                      className="h-8 px-2"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
          {editing ? (
            <div className="flex w-full gap-2 sm:w-auto">
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          ) : (
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
