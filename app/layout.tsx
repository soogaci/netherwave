import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { AuthProvider } from "@/components/providers/AuthProvider"
import { ProfileProvider } from "@/components/providers/ProfileProvider"
import { ToastProvider } from "@/components/providers/ToastProvider"
import { SettingsProvider } from "@/components/providers/SettingsProvider"
import { FeedProvider } from "@/components/providers/FeedProvider"
import { ChatsProvider } from "@/components/providers/ChatsProvider"
import { NotificationsProvider } from "@/components/providers/NotificationsProvider"
import { PlayerProvider } from "@/components/providers/PlayerProvider"
import { SavedMessagesProvider } from "@/components/providers/SavedMessagesProvider"
import { LayoutContent } from "@/components/app/LayoutContent"

export const metadata: Metadata = {
  title: "FeelReal",
  description: "Делись настоящим моментом. Соцсеть для тех, кто устал притворяться.",
  appleWebApp: {
    capable: true,
    title: "FeelReal",
    statusBarStyle: "black-translucent",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("feelreal-theme");if(t&&["default","light","mint","warm","neon","glass"].indexOf(t)!==-1){document.documentElement.setAttribute("data-theme",t);document.documentElement.classList.toggle("dark",["default","mint","warm","neon"].indexOf(t)!==-1);}if(/OS[ _]26/.test(navigator.userAgent)){document.documentElement.setAttribute("data-ios26","");}if(navigator.standalone===true){document.documentElement.setAttribute("data-standalone","");}}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Syne:wght@400;500;600;700;800&display=swap&subset=latin,cyrillic"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
          <ProfileProvider>
          <SettingsProvider>
            <FeedProvider>
            <ChatsProvider>
            <NotificationsProvider>
            <PlayerProvider>
            <SavedMessagesProvider>
            <ToastProvider>
              <LayoutContent>{children}</LayoutContent>
            </ToastProvider>
            </SavedMessagesProvider>
            </PlayerProvider>
            </NotificationsProvider>
            </ChatsProvider>
            </FeedProvider>
          </SettingsProvider>
          </ProfileProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
