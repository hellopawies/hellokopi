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
          __html: `(function(){try{var mq=window.matchMedia('(prefers-color-scheme: dark)');if(mq.matches)document.documentElement.classList.add('dark');mq.addEventListener('change',function(e){e.matches?document.documentElement.classList.add('dark'):document.documentElement.classList.remove('dark');});}catch(e){}})();`
        }} />
      </head>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
