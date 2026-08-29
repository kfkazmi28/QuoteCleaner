"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, Download, FileText, X, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { importClientContacts } from "@/app/actions/contacts"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

type AppField = "name" | "email" | "phone" | "address" | "notes" | "skip"

const APP_FIELDS: { value: AppField; label: string }[] = [
  { value: "name",    label: "Name"    },
  { value: "email",   label: "Email"   },
  { value: "phone",   label: "Phone"   },
  { value: "address", label: "Address" },
  { value: "notes",   label: "Notes"   },
  { value: "skip",    label: "— Skip —" },
]

// Common CSV header aliases → app field
const HEADER_MAP: Record<string, AppField> = {
  name: "name", fullname: "name", "full name": "name", client: "name", "client name": "name",
  email: "email", "email address": "email", "e-mail": "email",
  phone: "phone", "phone number": "phone", mobile: "phone", cell: "phone",
  address: "address", "home address": "address", street: "address", location: "address",
  notes: "notes", note: "notes", comments: "notes", comment: "notes",
}

function guessField(header: string): AppField {
  return HEADER_MAP[header.toLowerCase().trim()] ?? "skip"
}

// ─── CSV parser (handles quoted fields) ───────────────────────────────────────

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { field += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === "," && !inQuotes) {
      row.push(field); field = ""
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i++
      row.push(field); field = ""
      if (row.some(c => c !== "")) rows.push(row)
      row = []
    } else {
      field += ch
    }
  }
  if (field || row.length) { row.push(field); if (row.some(c => c !== "")) rows.push(row) }
  return rows
}

// ─── Sample CSV ───────────────────────────────────────────────────────────────

const SAMPLE_CSV = `name,email,phone,address,notes
Jane Smith,jane@example.com,(555) 123-4567,"123 Main St, Springfield, IL 62701",Prefers morning appointments
John Doe,john@example.com,(555) 987-6543,"456 Oak Ave, Chicago, IL 60601",
`

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "client-import-template.csv"
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onImported: () => void
}

type Step = "upload" | "map" | "importing" | "done"

export function ImportClientsModal({ open, onOpenChange, onImported }: Props) {
  const [step, setStep] = useState<Step>("upload")
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState("")
  const [headers, setHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<string[][]>([])  // first 3 data rows
  const [mapping, setMapping] = useState<AppField[]>([])
  const [allRows, setAllRows] = useState<string[][]>([])
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function reset() {
    setStep("upload")
    setDragging(false)
    setFileName("")
    setHeaders([])
    setPreview([])
    setMapping([])
    setAllRows([])
    setResult(null)
  }

  function handleClose(v: boolean) {
    if (!v) reset()
    onOpenChange(v)
  }

  function processFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a .csv file")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB")
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = parseCSV(text)
      if (rows.length < 2) { toast.error("CSV appears empty"); return }
      const [headerRow, ...dataRows] = rows
      setFileName(file.name)
      setHeaders(headerRow)
      setMapping(headerRow.map(guessField))
      setPreview(dataRows.slice(0, 3))
      setAllRows(dataRows)
      setStep("map")
    }
    reader.readAsText(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  async function handleImport() {
    setStep("importing")
    const nameIdx = mapping.indexOf("name")
    if (nameIdx === -1) {
      toast.error("You must map a column to Name")
      setStep("map")
      return
    }

    const rows = allRows.slice(0, 1000).map(row => ({
      name:    mapping.indexOf("name")    !== -1 ? row[mapping.indexOf("name")]    : "",
      email:   mapping.indexOf("email")   !== -1 ? row[mapping.indexOf("email")]   : undefined,
      phone:   mapping.indexOf("phone")   !== -1 ? row[mapping.indexOf("phone")]   : undefined,
      address: mapping.indexOf("address") !== -1 ? row[mapping.indexOf("address")] : undefined,
      notes:   mapping.indexOf("notes")   !== -1 ? row[mapping.indexOf("notes")]   : undefined,
    }))

    const res = await importClientContacts(rows)
    if (res.error) {
      toast.error(res.error)
      setStep("map")
      return
    }

    setResult({ imported: res.imported, skipped: res.skipped })
    setStep("done")
    onImported()

    if (res.imported > 0) {
      toast.success(`${res.imported} client${res.imported !== 1 ? "s" : ""} imported successfully`)
    }
    if (res.skipped > 0) {
      toast.warning(`${res.skipped} row${res.skipped !== 1 ? "s" : ""} skipped due to missing name or duplicate`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Clients</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk-import your client list.
          </DialogDescription>
        </DialogHeader>

        {/* ── Step: Upload ── */}
        {step === "upload" && (
          <div className="flex flex-col gap-4">
            <button
              className="text-sm text-primary hover:underline flex items-center gap-1.5 w-fit"
              onClick={downloadSample}
              type="button"
            >
              <Download className="h-3.5 w-3.5" />
              Download CSV Template
            </button>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors",
                dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"
              )}
            >
              <Upload className={cn("h-8 w-8", dragging ? "text-primary" : "text-muted-foreground")} />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Drag & drop your CSV here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse — .csv only, max 1,000 rows</p>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }}
            />
          </div>
        )}

        {/* ── Step: Map ── */}
        {step === "map" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm text-foreground truncate">{fileName}</span>
              <span className="ml-auto text-xs text-muted-foreground shrink-0">{allRows.length} rows</span>
              <button onClick={reset} className="ml-1 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">Map your CSV columns to the correct fields.</p>

            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
              {headers.map((col, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{col}</p>
                    {preview[0]?.[i] && (
                      <p className="text-[11px] text-muted-foreground truncate">{preview[0][i]}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">→</span>
                  <Select
                    value={mapping[i]}
                    onValueChange={v => setMapping(m => { const n = [...m]; n[i] = v as AppField; return n })}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APP_FIELDS.map(f => (
                        <SelectItem key={f.value} value={f.value} className="text-xs">
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {!mapping.includes("name") && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Map at least one column to Name before importing.
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={reset}>Back</Button>
              <Button
                onClick={handleImport}
                disabled={!mapping.includes("name")}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Import {allRows.length > 1000 ? "1,000" : allRows.length} Clients
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── Step: Importing ── */}
        {step === "importing" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
            <p className="text-sm text-muted-foreground">Importing clients...</p>
          </div>
        )}

        {/* ── Step: Done ── */}
        {step === "done" && result && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle2 className="h-10 w-10 text-primary" />
              <div className="text-center">
                <p className="text-base font-semibold text-foreground">
                  {result.imported} client{result.imported !== 1 ? "s" : ""} imported
                </p>
                {result.skipped > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {result.skipped} row{result.skipped !== 1 ? "s" : ""} skipped (missing name or duplicate)
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
