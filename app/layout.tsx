import type { Metadata, Viewport } from "next";
import { Pixelify_Sans } from "next/font/google";
import "./globals.css";
import { GameProvider } from "@/lib/store/game";
import GameShell from "@/components/layout/GameShell";

const pixel = Pixelify_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "Self-Farm",
  description: "Одне дерево. Один рух. Маленька гра про повернення до себе.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0c0a16",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={pixel.variable}>
      <body>
        <GameProvider>
          <GameShell>{children}</GameShell>
        </GameProvider>
      </body>
    </html>
  );
}
