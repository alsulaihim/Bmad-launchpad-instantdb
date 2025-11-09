import { ArrowRight, Lightbulb, Layers, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Landing page for Vibe Coding Launchpad
 * Corporate-style design with clear value proposition and workflow overview
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-foreground rounded" />
            <span className="text-xl font-semibold">
              Vibe Coding Launchpad
            </span>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Transform Ideas into
            <br />
            <span className="text-muted-foreground">Production-Ready Code</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            A structured framework for brainstorming, designing, and launching
            your next project. Get a comprehensive PRD and AI-ready prompts to
            accelerate development.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="text-base">
              Start Your Project
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-base">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                The BMAD Framework
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                A proven three-stage workflow that guides you from concept to
                code-ready specification.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Stage 1 */}
              <div className="bg-background border border-border rounded-lg p-8 space-y-4">
                <div className="h-12 w-12 bg-foreground rounded-lg flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-background" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Stage 1
                  </div>
                  <h3 className="text-xl font-semibold">
                    Brainstorming & Requirements
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Define your project vision, core features, and business
                  objectives through guided questions and AI-assisted ideation.
                </p>
              </div>

              {/* Stage 2 */}
              <div className="bg-background border border-border rounded-lg p-8 space-y-4">
                <div className="h-12 w-12 bg-foreground rounded-lg flex items-center justify-center">
                  <Layers className="h-6 w-6 text-background" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Stage 2
                  </div>
                  <h3 className="text-xl font-semibold">
                    Tech Stack & Architecture
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Select optimal technologies, define system architecture, and
                  establish technical constraints based on your requirements.
                </p>
              </div>

              {/* Stage 3 */}
              <div className="bg-background border border-border rounded-lg p-8 space-y-4">
                <div className="h-12 w-12 bg-foreground rounded-lg flex items-center justify-center">
                  <Palette className="h-6 w-6 text-background" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Stage 3
                  </div>
                  <h3 className="text-xl font-semibold">UI/UX Design</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Craft user interface specifications, design patterns, and
                  interaction flows that align with modern UX principles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Output Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="bg-muted/50 border border-border rounded-lg p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Your Comprehensive PRD
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Upon completion, receive a production-ready Product Requirements
              Document and AI-optimized prompts to kickstart development with
              any coding agent.
            </p>
            <div className="pt-4">
              <Button size="lg">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2025 Vibe Coding Launchpad. Built with the BMAD Framework.
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Documentation
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                GitHub
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

