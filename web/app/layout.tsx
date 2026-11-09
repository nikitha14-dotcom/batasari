import { ClientErrorListener } from "@/components/ClientErrorListener";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";

import "./globals.css";

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
    <html lang="en" suppressHydrationWarning>
      <body>
        <LanguageProvider>
          <ClientErrorListener />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
