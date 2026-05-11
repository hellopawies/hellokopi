import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "./components/Header";
import { PullToRefresh } from "./components/PullToRefresh";

// Self-hosted via next/font — replaces the previous render-blocking
// @import from fonts.googleapis.com. Variables are exposed as
// --font-sans / --font-serif and consumed via Tailwind's fontFamily config.
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-sans",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hello Kopi",
  description: "Lunch drink orders, made easy.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF8" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <head>
        <link rel="manifest" href="/hellokopi/manifest.json" />
        {/* Default apple-touch-icon — cream brand background, blends with iOS
            light home screen and tinted modes. Dark variant kicks in via
            media query for users with dark home-screen appearance. iOS PWA
            icons are not auto-tinted by iOS 18; this dual-icon setup is the
            closest standard equivalent for adapting to user preference. */}
        <link rel="apple-touch-icon" href="/hellokopi/icon.svg" />
        <link rel="apple-touch-icon" href="/hellokopi/icon-dark.svg" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Hello Kopi" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <PullToRefresh />
        <Header />
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/hellokopi/sw.js', { scope: '/hellokopi/' });
            });
          }
        `}} />
      </body>
    </html>
  );
}
