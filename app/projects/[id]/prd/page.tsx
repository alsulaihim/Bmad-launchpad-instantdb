"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/instantdb/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Copy, Loader2, CheckCircle2, FileText, Code, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
}

interface StageData {
  stage_number: number;
  stage_name: string;
  completed: boolean;
  summary: string | null;
  responses: {
    messages: Array<{ role: string; content: string }>;
  } | null;
}

export default function PRDPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const { isLoading: authLoading, user } = db.useAuth();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [stages, setStages] = useState<StageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [prdContent, setPrdContent] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    } else if (user) {
      loadProjectAndStages();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, user, authLoading]);

  const loadProjectAndStages = async () => {
    try {
      // We need a token for API calls. Using localStorage hack for now.
      const storageKey = Object.keys(localStorage).find(k => k.startsWith("instantdb-token") || k.includes("token")); 
      const token = storageKey ? localStorage.getItem(storageKey) : "";

      // Load project
      const projectResponse = await fetch(`/api/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (projectResponse.ok) {
        const data = await projectResponse.json();
        setProject(data.project);
      }

      // Load all 3 stages
      const stagesData: StageData[] = [];
      for (let i = 1; i <= 3; i++) {
        const stageResponse = await fetch(
          `/api/projects/${projectId}/stages/${i}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (stageResponse.ok) {
          const data = await stageResponse.json();
          stagesData.push(data.stage);
        }
      }

      setStages(stagesData);

      // Check if all stages are completed
      const allCompleted = stagesData.every((stage) => stage.completed);
      if (!allCompleted) {
        alert("All stages must be completed before generating PRD.");
        router.push("/dashboard");
        return;
      }

      // Check if PRD already exists
      const prdResponse = await fetch(`/api/projects/${projectId}/prd`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (prdResponse.ok) {
        const prdData = await prdResponse.json();
        if (prdData.prd && prdData.prd.content) {
          // PRD already exists, use it
          setPrdContent(prdData.prd.content);
          setLoading(false);
          return;
        }
      }

      // PRD doesn't exist, generate it
      await generatePRD(stagesData, token || "");

      setLoading(false);
    } catch (error) {
      console.error("Error loading project:", error);
      setLoading(false);
    }
  };

  const generatePRD = async (stagesData: StageData[], token: string) => {
    setGenerating(true);

    try {
      // Call PRD generation API
      const response = await fetch(`/api/projects/${projectId}/generate-prd`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stages: stagesData }),
      });

      if (response.ok) {
        const data = await response.json();
        setPrdContent(data.prd);
      } else {
        // Fallback: Generate simple PRD from stage data
        const simplePRD = generateSimplePRD(stagesData);
        setPrdContent(simplePRD);
      }
    } catch (error) {
      console.error("Error generating PRD:", error);
      // Fallback to simple PRD
      const simplePRD = generateSimplePRD(stagesData);
      setPrdContent(simplePRD);
    } finally {
      setGenerating(false);
    }
  };

  const generateSimplePRD = (stagesData: StageData[]): string => {
    const stage1 = stagesData.find((s) => s.stage_number === 1);
    const stage2 = stagesData.find((s) => s.stage_number === 2);
    const stage3 = stagesData.find((s) => s.stage_number === 3);

    return `# Product Requirements Document
# ${project?.name || "Project"}

**Generated:** ${new Date().toLocaleDateString()}

---

## Executive Summary

${project?.description || ""}

---

## 1. Requirements & Goals

${stage1?.summary || "No requirements gathered."}

---

## 2. Technical Architecture

${stage2?.summary || "No architecture defined."}

---

## 3. UI/UX Design

${stage3?.summary || "No UI/UX design specified."}

---

## Appendix: Conversation History

### Stage 1: Brainstorming & Requirements
${stage1?.responses?.messages.map((m) => `**${m.role}:** ${m.content}`).join("\n\n") || ""}

### Stage 2: Tech Stack & Architecture
${stage2?.responses?.messages.map((m) => `**${m.role}:** ${m.content}`).join("\n\n") || ""}

### Stage 3: UI/UX Design
${stage3?.responses?.messages.map((m) => `**${m.role}:** ${m.content}`).join("\n\n") || ""}

---

*Generated by Vibe Coding Launchpad*
`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(prdContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPRD = () => {
    const blob = new Blob([prdContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Format project name for filename (replace spaces with underscores, remove special chars)
    const sanitizedName = project?.name
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "_")
      .toLowerCase() || "project";
    a.download = `${sanitizedName}_PRD.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateVibeCodingPrompt = (): string => {
    return `# Vibe Coding Initial Prompt

I want to build: **${project?.name}**

Here's the complete Product Requirements Document (PRD) for this project:

${prdContent}

---

Please analyze this PRD and help me start building this project.

**Next Steps:**
1. Review the requirements, architecture, and UI/UX specifications
2. Suggest the initial project structure and files to create
3. Guide me through setting up the development environment
4. Help me implement the core features step by step

Let's start coding!`;
  };

  const copyVibeCodingPrompt = () => {
    const prompt = generateVibeCodingPrompt();
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadVibeCodingPrompt = () => {
    const prompt = generateVibeCodingPrompt();
    const blob = new Blob([prompt], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const sanitizedName = project?.name
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "_")
      .toLowerCase() || "project";
    a.download = `${sanitizedName}_vibe_coding_prompt.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading project data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{project?.name}</h1>
                <p className="text-sm text-muted-foreground">
                  Product Requirements Document
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                disabled={generating}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={downloadPRD}
                disabled={generating}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Stage Completion Status */}
      <div className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2">
            {stages.map((stage) => (
              <div key={stage.stage_number} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    stage.completed
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {stage.completed ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    stage.stage_number
                  )}
                </div>
                {stage.stage_number < 3 && (
                  <div
                    className={`w-16 h-0.5 ${
                      stage.completed ? "bg-green-500" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRD Content */}
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl">
        {generating ? (
          <div className="text-center py-12">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-muted-foreground mx-auto mb-4" />
            <h2 className="text-base sm:text-lg font-semibold mb-2">Generating your PRD...</h2>
            <p className="text-sm text-muted-foreground">
              Compiling insights from all three stages
            </p>
          </div>
        ) : (
          <>
            {/* PRD Document */}
            <div className="bg-muted/30 border border-border rounded-lg p-4 sm:p-8 mb-6 sm:mb-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                <h2 className="text-xl sm:text-2xl font-bold">Product Requirements Document</h2>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed">
                  {prdContent}
                </pre>
              </div>
            </div>

            {/* Vibe Coding Prompt */}
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-2 border-purple-500/20 rounded-lg p-4 sm:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                <h2 className="text-lg sm:text-2xl font-bold">Ready to Start Vibe Coding?</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4 sm:mb-6">
                Your PRD is complete! Copy the prompt below and paste it into your favorite AI coding assistant (Claude, GPT-4, etc.) to start building your project.
              </p>

              <div className="bg-background/50 border border-border rounded-lg p-4 sm:p-6 mb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs sm:text-sm font-medium">Vibe Coding Initial Prompt</span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyVibeCodingPrompt}
                      className="flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Copy Prompt
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={downloadVibeCodingPrompt}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                <div className="bg-muted/50 border border-border rounded p-4 max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-mono text-xs">
                    {generateVibeCodingPrompt()}
                  </pre>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Pro Tip:</strong> Open Claude Code, paste this prompt, and let the AI guide you through setting up your project structure, installing dependencies, and implementing features step by step. Your PRD includes all the context needed for intelligent code generation!
                </p>
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        {!generating && (
          <div className="mt-8 flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </Button>
            <Button
              variant="default"
              onClick={() => router.push(`/projects/${projectId}/stage/1`)}
            >
              Review Stages
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
