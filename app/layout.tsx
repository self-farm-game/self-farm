import type { Metadata, Viewport } from "next";
import { Exo_2 } from "next/font/google";
import "./globals.css";
import "./glass.css";
import { GameProvider } from "@/lib/store/game";
import GameShell from "@/components/layout/GameShell";

const ui = Exo_2({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ui",
});

export const metadata: Metadata = {
  title: "Self-Farm",
  description: "Одне дерево. Один рух. Маленька гра про повернення до себе.",
  // Маніфест і ці іконки потрібні не для краси: на iPhone web push працює
  // ЛИШЕ коли гра додана на головний екран, а без маніфесту її туди не
  // додати як застосунок.
  manifest: "/manifest.webmanifest",
  applicationName: "Self-Farm",
  appleWebApp: { capable: true, title: "Self-Farm", statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: "/assets/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/assets/icons/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0c0a16",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={ui.variable}>
      <body>
        <GameProvider>
          <GameShell>{children}</GameShell>
        </GameProvider>
      </body>
    </html>
  );
}
