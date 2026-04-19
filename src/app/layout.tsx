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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`
        }} />
      </head>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
