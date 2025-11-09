import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Vibe Coding Launchpad | BMAD Framework",
  description:
    "A structured workflow for brainstorming, designing, and launching your next project with AI-powered guidance.",
  keywords: [
    "BMAD framework",
    "project planning",
    "requirements gathering",
    "tech stack selection",
    "PRD generator",
  ],
};

/**
 * Root layout component
 * Provides theme support and base HTML structure
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

