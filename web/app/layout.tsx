import type { Metadata, Viewport } from "next";
import {
  Fraunces,
  Noto_Sans_Devanagari,
  Noto_Sans_Kannada,
  Plus_Jakarta_Sans,
} from "next/font/google";
import Link from "next/link";
import { AmbientBackground } from "@/components/AmbientBackground";
import { FlameCursor } from "@/components/FlameCursor";
import { SmoothScroll } from "@/components/SmoothScroll";
import { BottomNav } from "@/components/bottom-nav";
import { TopNav } from "@/components/top-nav";
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
          <SmoothScroll />
          <AmbientBackground />
          <FlameCursor />
          <header className="sticky top-0 z-30 bg-[rgba(250,247,242,0.84)] backdrop-blur-sm">
            <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
              <Link href="/" className="font-serif text-xl font-semibold text-primary">
                Saarthi
              </Link>
              <TopNav />
              <div className="min-w-12">
                <DemoReset />
              </div>
            </div>
          </header>
          <div className="mx-auto min-h-dvh max-w-[1280px] px-4 pb-28 pt-2 sm:px-6 lg:px-10 lg:pb-12">
            {children}
          </div>
          <BottomNav />
        </SessionProvider>
      </body>
    </html>
  );
}
