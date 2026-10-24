import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Newsreader, Poppins } from "next/font/google";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

const display = Poppins({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const accent = Newsreader({
  variable: "--font-accent",
  subsets: ["latin"],
  weight: ["700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} — AI tool spend per person, with budgets`,
  description:
    "See every person's Cursor spend, warn them before they blow the budget, and cap it automatically. No proxy, nothing to install.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${accent.variable} ${mono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
