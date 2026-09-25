import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const interfaceFont = Manrope({
  variable: "--font-interface",
  subsets: ["latin"],
  display: "swap",
});

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://safircodex.example",
  ),
  title: "Safir Codex",
  description: "Explore the cards, seasons and world of Safir.",
  applicationName: "Safir Codex",
  openGraph: {
    title: "Safir Codex",
    description: "Explore the cards, seasons and world of Safir.",
    type: "website",
    siteName: "Safir Codex",
  },
  twitter: {
    card: "summary_large_image",
    title: "Safir Codex",
    description: "Explore the cards, seasons and world of Safir.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${interfaceFont.variable} ${displayFont.variable} min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider delay={250}>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
