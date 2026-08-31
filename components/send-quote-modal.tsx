"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Mail,
  MessageSquare,
  FileDown,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { updateQuote } from "@/app/actions/quotes";
import { exportQuotePdf } from "@/lib/export-quote-pdf";
import { COMPANY_NAME } from "@/lib/company-config";

export interface SendQuoteData {
  quoteId?: string | null;
  quoteName: string;
  selectedTier?: string | null;
  tierDescription?: string | null;
  homeVariables?: {
    squareFootage?: string | number | null;
    bedrooms?: string | number | null;
    bathrooms?: string | number | null;
    pets?: string | number | null;
    children?: string | number | null;
  };
  homeAddress: string;
  clientName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  generatedBy?: string | null;
  notes?: string | null;
  estimatedHours?: number;
  resultStandard: number;
  resultDeepClean: number;
  resultMoveIn: number;
  resultMonthly: number;
  resultBiweekly: number;
  resultWeekly: number;
  createdAt?: string;
  checklist?: { section: string; items: string[] }[];
}
interface Draft {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
}
const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);

export function SendQuoteModal({
  open,
  onClose,
  data,
  onContactSaved,
}: {
  open: boolean;
  onClose: () => void;
  data: SendQuoteData | null;
  onContactSaved?: (updated: Partial<SendQuoteData>) => void;
}) {
  const [contact, setContact] = useState<Draft>({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
  });
  const [method, setMethod] = useState<"email" | "text" | "pdf">("pdf");
  const tone = "Professional";
  const setTone = (_nextTone: string) => undefined;
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (data) {
      setContact({
        clientName: data.clientName ?? "",
        clientEmail: data.clientEmail ?? "",
        clientPhone: data.clientPhone ?? "",
      });
      setMessage(
        `Hi ${data.clientName || "there"},\n\nThank you for your interest in ${data.quoteName}. Your personalized cleaning quote is ready. We’d be happy to answer any questions and help you schedule your service.\n\nBest,\n${data.generatedBy || COMPANY_NAME}`,
      );
    }
  }, [data]);
  if (!data) return null;
  const selectedPrice = data.quoteName.toLowerCase().includes("deep")
    ? data.resultDeepClean
    : data.quoteName.toLowerCase().includes("move")
      ? data.resultMoveIn
      : data.resultStandard;
  const generate = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/quote-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, ...contact, tone }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error();
      setMessage(
        (result.message || "").replace(/\*+/g, "").replace(/^\s*[-•]\s*/gm, ""),
      );
    } catch {
      toast.error("Could not generate a message right now.");
    } finally {
      setSaving(false);
    }
  };
  const email = () => {
    if (!contact.clientEmail) return toast.error("Add a client email first.");
    const url = `mailto:${contact.clientEmail}?subject=${encodeURIComponent(`Your Cleaning Quote – ${data.quoteName}`)}&body=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const text = () => {
    if (!contact.clientPhone) return toast.error("Add a client phone first.");
    const url = `sms:${contact.clientPhone}?body=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const openEditablePdf = () => {
    exportQuotePdf(data);
    toast.success("PDF opened. Save it, then attach it to your email or text.");
  };
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="relative isolate overflow-hidden border-b border-border bg-secondary px-6 py-7">
          <Image src="/images/cleaning-brand-pattern.png" alt="" fill sizes="672px" className="pointer-events-none absolute inset-0 -z-20 h-full w-full scale-125 object-cover object-center opacity-70" />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-secondary/90 via-background/75 to-accent/70" />
          <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> CleanQuote Pro
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight sm:text-3xl">Share Quote</DialogTitle>
          <DialogDescription>
            <span className="sr-only">Quote sharing options</span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-7 px-6 py-6">
          <section className="order-2 flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              Share via
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  {
                    key: "email",
                    Icon: Mail,
                    title: "Email",
                    desc: "Send a polished quote by email",
                  },
                  {
                    key: "text",
                    Icon: MessageSquare,
                    title: "Text",
                    desc: "Send a quick quote by text",
                  },
                ] as const
              ).map(({ key, Icon, title, desc }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMethod(key)}
                  className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors ${method === key ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{title}</span>
                  <span className="text-xs leading-5 text-muted-foreground">
                    {desc}
                  </span>
                </button>
              ))}
            </div>
          </section>
          {method !== "pdf" && (
            <section className="order-3 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                  Message preview
                </h3>
                <div className="flex gap-1">
                  {["Professional", "Friendly", "Concise"].map((option) => (
                    <Button
                      key={option}
                      type="button"
                      size="sm"
                      variant={tone === option ? "secondary" : "ghost"}
                      onClick={() => {
                        setTone(option);
                        void generate();
                      }}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-40 resize-y"
              />
              <Button
                type="button"
                variant="ghost"
                className="self-start px-0 text-primary"
                onClick={generate}
                disabled={saving}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
              <Button
                type="button"
                onClick={method === "email" ? email : text}
                className="w-full sm:w-auto sm:self-end"
              >
                {method === "email" ? (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email →
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Open Messages →
                  </>
                )}
              </Button>
            </section>
          )}
          <section className="order-1 flex flex-col gap-4 rounded-xl border border-border p-4">
              <div className="rounded-lg bg-muted/30 p-5">
                <p className="text-sm text-muted-foreground">Create a professional quote PDF</p>
                <p className="font-semibold text-primary">{COMPANY_NAME}</p>
                <p className="mt-4 text-lg font-semibold">{data.quoteName}</p>
                <p className="mt-2 text-3xl font-bold">
                  {money(selectedPrice)}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {contact.clientName || "Client"} · {data.homeAddress}
                </p>
              </div>
              <Button
                type="button"
                onClick={() =>
                  exportQuotePdf({
                    ...data,
                    clientName: contact.clientName,
                    clientEmail: contact.clientEmail,
                    clientPhone: contact.clientPhone,
                  })
                }
                className="w-full sm:w-auto sm:self-end"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Download PDF ↓
              </Button>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
