import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { ToastProvider } from "@/components/providers/ToastProvider"
import { SettingsProvider } from "@/components/providers/SettingsProvider"
import { FeedProvider } from "@/components/providers/FeedProvider"
import { PlayerProvider } from "@/components/providers/PlayerProvider"
import { SavedMessagesProvider } from "@/components/providers/SavedMessagesProvider"
import { AppShell } from "@/components/app/AppShell"
import { PageLayout } from "@/components/app/PageLayout"

export const metadata: Metadata = {
  title: "Netherwave",
  description: "Социальная сеть",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap&subset=latin,cyrillic"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <SettingsProvider>
            <FeedProvider>
            <PlayerProvider>
            <SavedMessagesProvider>
            <ToastProvider>
              <AppShell>
                <div className="safe-area-padding pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
                  <PageLayout>{children}</PageLayout>
                </div>
              </AppShell>
            </ToastProvider>
            </SavedMessagesProvider>
            </PlayerProvider>
            </FeedProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
