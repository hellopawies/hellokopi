import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { PullToRefresh } from "@/components/PullToRefresh";
import { LanguageProvider } from "@/lib/language";

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
        {/* Content-Security-Policy (defense-in-depth). GitHub Pages can't set
            HTTP headers, so this is the <meta> form. 'unsafe-inline' is
            required for scripts/styles because a static Next export injects
            inline hydration scripts and there's no way to attach a per-request
            nonce. The high-value directives here are connect-src (only this
            origin + our Supabase project can receive fetch/websocket traffic,
            so a future XSS can't exfiltrate data elsewhere) and object-src
            'none'. frame-ancestors / X-Frame-Options need a real header and
            can't be set from a static host. */}
        <meta
          httpEquiv="Content-Security-Policy"
          content={[
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data:",
            "font-src 'self'",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
            "manifest-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join("; ")}
        />
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
        <LanguageProvider>
          <PullToRefresh />
          <Header />
          {children}
        </LanguageProvider>
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
