import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hello Kopi",
  description: "Lunch drink orders, made easy.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
