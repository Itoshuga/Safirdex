import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const interfaceFont = Inter({
  variable: "--font-interface",
  subsets: ["latin"],
  display: "swap",
});

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://safircodex.example",
  ),
  title: "Safirdex",
  description: "The official card and rules Codex for Safir.",
  applicationName: "Safirdex",
  openGraph: {
    title: "Safirdex",
    description: "The official card and rules Codex for Safir.",
    type: "website",
    siteName: "Safirdex",
  },
  twitter: {
    card: "summary_large_image",
    title: "Safirdex",
    description: "The official card and rules Codex for Safir.",
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
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delay={250}>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
