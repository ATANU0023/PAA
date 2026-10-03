import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PAA — Personal Autonomous Companion",
  description: "Private local-first autonomous digital employee & desktop companion",
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
