import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next"
import { Caveat, Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"
import { PricingSettingsProvider } from "@/contexts/pricing-settings-context"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })
const caveat = Caveat({ subsets: ["latin"], variable: "--font-hand" })

export const metadata: Metadata = {
  title: "Cleaning Estimate Calculator | CleanQuote Pro",
  description:
    "Create professional cleaning quotes in seconds for your cleaning business.",
  keywords: [
    "cleaning estimate calculator",
    "cleaning quote software",
    "cleaning business pricing tool",
    "house cleaning quote generator",
    "janitorial estimate software"
  ],
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-light-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-icon.png",
    shortcut: "/favicon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} bg-background`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <PricingSettingsProvider>
            {children}
            <Toaster position="top-center" richColors closeButton />
          </PricingSettingsProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
