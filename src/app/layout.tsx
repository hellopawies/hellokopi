import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "./components/Header";

export const metadata: Metadata = {
  title: "Hello Kopi",
  description: "Lunch drink orders, made easy.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/hellokopi/manifest.json" />
        <link rel="apple-touch-icon" href="/hellokopi/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Hello Kopi" />
        <meta name="theme-color" content="#292524" />
      </head>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
