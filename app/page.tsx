"use client";

import Link from "next/link";
import { ArrowRight, Lightbulb, Layers, Palette, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

/**
 * Landing page for Vibe Coding Launchpad
 * Vercel-inspired design with dark theme, gradients, and modern aesthetics
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background gradient effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-slate-400/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 left-1/2 w-[500px] h-[500px] bg-orange-400/10 rounded-full blur-[128px]" />
      </div>

      {/* Navigation */}
      <nav className="border-b border-border backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <Logo />
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/auth/login" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                Sign In
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">
                  Get Started
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            {/* Left: Hero Content */}
            <div className="space-y-4 sm:space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                <span>Powered by BMAD Framework</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                Transform Ideas into Production-Ready Code
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                A structured framework for brainstorming, designing, and launching
                your next project. Get a comprehensive PRD and AI-ready prompts in minutes.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <Button className="h-10 px-6 w-full sm:w-auto">
                    Start Your Project
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#workflow" className="w-full sm:w-auto">
                  <Button variant="outline" className="h-10 px-6 w-full sm:w-auto">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Workflow Cards */}
            <div className="grid gap-4">
              {/* Stage 1 */}
              <div className="group relative bg-card border border-border rounded-xl p-5 hover:border-orange-500/50 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500/0 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                <div className="relative flex gap-4 items-start">
                  <div className="inline-flex h-10 w-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg items-center justify-center flex-shrink-0">
                    <Lightbulb className="h-5 w-5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Stage 1
                    </div>
                    <h3 className="text-lg font-semibold">
                      Brainstorming & Requirements
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Define your project vision and core features through AI-assisted ideation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stage 2 */}
              <div className="group relative bg-card border border-border rounded-xl p-5 hover:border-slate-400/50 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-400/0 to-slate-400/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                <div className="relative flex gap-4 items-start">
                  <div className="inline-flex h-10 w-10 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg items-center justify-center flex-shrink-0">
                    <Layers className="h-5 w-5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Stage 2
                    </div>
                    <h3 className="text-lg font-semibold">
                      Tech Stack & Architecture
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Select optimal technologies and define system architecture.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stage 3 */}
              <div className="group relative bg-card border border-border rounded-xl p-5 hover:border-orange-400/50 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-b from-orange-400/0 to-orange-400/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                <div className="relative flex gap-4 items-start">
                  <div className="inline-flex h-10 w-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg items-center justify-center flex-shrink-0">
                    <Palette className="h-5 w-5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Stage 3
                    </div>
                    <h3 className="text-lg font-semibold">
                      UI/UX Design
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Craft user interface specs and modern interaction flows.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-slate-400 bg-clip-text text-transparent">3</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">Guided Stages</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-400 to-orange-400 bg-clip-text text-transparent">AI</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">Powered</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">PRD</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">Ready Output</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-300 to-slate-500 bg-clip-text text-transparent">∞</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">Possibilities</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-500/10 via-slate-400/10 to-orange-400/10 border border-border rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_50%)]" />
            <div className="relative space-y-3 sm:space-y-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
                Your Comprehensive PRD
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto px-2">
                Upon completion, receive a production-ready Product Requirements
                Document and AI-optimized prompts to kickstart development.
              </p>
              <div className="pt-2">
                <Link href="/auth/signup">
                  <Button className="h-10 px-6 w-full sm:w-auto">
                    Get Started Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-6 sm:mt-8">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="text-[10px] sm:text-xs text-muted-foreground text-center md:text-left">
              © 2025 Vibe Coding Launchpad. Built with the BMAD Framework.
            </div>
            <div className="flex gap-4 sm:gap-6 text-[10px] sm:text-xs">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Documentation
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                GitHub
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

