import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LORE Token Sale",
  description: "A bonding curve based token sale application for the LORE token",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
