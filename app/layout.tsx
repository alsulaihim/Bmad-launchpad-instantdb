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
  openGraph: {
    title: "Vibe Coding Launchpad | BMAD Framework",
    description:
      "Transform ideas into production-ready code. A structured framework for brainstorming, designing, and launching your next project.",
    url: "https://vibe-coding-launchpad.vercel.app",
    siteName: "Vibe Coding Launchpad",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Vibe Coding Launchpad - Transform Ideas into Production-Ready Code",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibe Coding Launchpad | BMAD Framework",
    description:
      "Transform ideas into production-ready code with AI-powered guidance through structured planning stages.",
    images: ["/og-image.png"],
  },
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

