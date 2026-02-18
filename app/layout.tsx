import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { AuthProvider } from "@/components/providers/AuthProvider"
import { ProfileProvider } from "@/components/providers/ProfileProvider"
import { ToastProvider } from "@/components/providers/ToastProvider"
import { SettingsProvider } from "@/components/providers/SettingsProvider"
import { FeedProvider } from "@/components/providers/FeedProvider"
import { PlayerProvider } from "@/components/providers/PlayerProvider"
import { SavedMessagesProvider } from "@/components/providers/SavedMessagesProvider"
import { LayoutContent } from "@/components/app/LayoutContent"

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
          <AuthProvider>
          <ProfileProvider>
          <SettingsProvider>
            <FeedProvider>
            <PlayerProvider>
            <SavedMessagesProvider>
            <ToastProvider>
              <LayoutContent>{children}</LayoutContent>
            </ToastProvider>
            </SavedMessagesProvider>
            </PlayerProvider>
            </FeedProvider>
          </SettingsProvider>
          </ProfileProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
