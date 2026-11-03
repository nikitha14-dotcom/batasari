import { Inter } from "next/font/google";

import { ClientErrorListener } from "@/components/ClientErrorListener";

import "./globals.css";

/**
 * The Figma onboarding file specifies Inter for UI text and Geist for the
 * wordmark. next/font self-hosts Inter at build time, so there is no runtime
 * request to Google and no layout shift on first paint.
 *
 * Geist is NOT available in next/font/google on Next 14.2 — it needs either a
 * Next 15 upgrade or the `geist` package. Until one of those happens the
 * wordmark falls back to Inter, which is the closest metric match already in
 * the bundle. This is the one intentional deviation from the Figma type spec.
 *
 * Both are exposed as CSS variables rather than a className on <body>, so the
 * rest of the app keeps its existing Arial stack until it is migrated screen
 * by screen.
 */
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Batasari | Your move to India, made clearer",
  description:
    "Plan a move within India or a new stay in India with city guidance, moving checklists, and trusted official resources.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Browser extensions can add attributes such as data-theme to <html>
    // before React hydrates. The app does not own those attributes, so avoid
    // showing a development error when an extension changes them.
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <ClientErrorListener />
        {children}
      </body>
    </html>
  );
}

