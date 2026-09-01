"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Zap, History, Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/dashboard/communications/templates", label: "Templates", icon: FileText },
  { href: "/dashboard/communications/automations", label: "Automations", icon: Zap },
  { href: "/dashboard/communications/history", label: "History", icon: History },
  { href: "/dashboard/communications/settings", label: "Settings", icon: Settings2 },
]

export function CommunicationsSubnav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Communications sections" className="mt-6 border-b border-border">
      <ul className="-mb-px flex gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const active = pathname.startsWith(t.href)
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
