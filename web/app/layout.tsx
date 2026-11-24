import type { Metadata, Viewport } from "next";
import {
  Fraunces,
  Noto_Sans_Devanagari,
  Noto_Sans_Kannada,
  Plus_Jakarta_Sans,
} from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import { DemoReset } from "@/components/demo-reset";
import { SessionProvider } from "@/lib/session";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});
const kannada = Noto_Sans_Kannada({
  subsets: ["kannada"],
  variable: "--font-kannada",
  display: "swap",
});
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Saarthi",
  description: "Find the scholarships you appear eligible for.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#faf7f2" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jakarta.variable} ${kannada.variable} ${devanagari.variable}`}
    >
      <body>
        <SessionProvider>
          <div className="mx-auto min-h-dvh max-w-4xl px-4 pb-28 pt-4">
            <div className="mb-3 flex justify-end">
              <DemoReset />
            </div>
            {children}
          </div>
          <BottomNav />
        </SessionProvider>
      </body>
    </html>
  );
}
