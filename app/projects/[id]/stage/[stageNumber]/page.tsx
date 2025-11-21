"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/instantdb/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2, Send, Sparkles, Check, Eye } from "lucide-react";
import { generateAgentGreeting } from "@/lib/services/claude.service";
import { ThemeToggle } from "@/components/theme-toggle";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  current_stage: number;
  status: "in_progress" | "completed" | "archived";
}

interface StageData {
  stage_number: number;
  completed: boolean;
  summary: string | null;
  responses: {
    messages: Message[];
  } | null;
}

const STAGE_CONFIG = {
  1: {
    name: "Brainstorming & Requirements",
    agentType: "analyst" as const,
    agentName: "Analyst",
    description: "Define your project vision, goals, and core requirements",
    color: "blue",
  },
  2: {
    name: "Tech Stack & Architecture",
    agentType: "architect" as const,
    agentName: "Architect",
    description: "Select technologies and design your system architecture",
    color: "purple",
  },
  3: {
    name: "UI/UX Design",
    agentType: "designer" as const,
    agentName: "Designer",
    description: "Design user interface and experience requirements",
    color: "green",
  },
};

export default function StagePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const stageNumber = parseInt(params.stageNumber as string);

  const { isLoading: authLoading, user } = db.useAuth();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [stageData, setStageData] = useState<StageData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [stageSummary, setStageSummary] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stageConfig = STAGE_CONFIG[stageNumber as keyof typeof STAGE_CONFIG];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    } else if (user) {
      loadProject();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, user, authLoading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  useEffect(() => {
    // Auto-save conversation after messages change (debounced)
    // Don't auto-save in review mode
    if (!isReviewMode && messages.length > 1) { // Only save if there's actual conversation (more than just greeting)
      // Clear previous timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout to save after 2 seconds of inactivity
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSaveConversation();
      }, 2000);
    }

    // Cleanup timeout on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isReviewMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getToken = () => {
     const storageKey = Object.keys(localStorage).find(k => k.startsWith("instantdb-token") || k.includes("token")); 
     return storageKey ? localStorage.getItem(storageKey) : "";
  };

  const autoSaveConversation = async () => {
    try {
      setAutoSaving(true);
      const token = getToken();

      const conversationSummary = messages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n\n");

      await fetch(`/api/projects/${projectId}/stages/${stageNumber}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          summary: conversationSummary,
          responses: { messages },
        }),
      });
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setAutoSaving(false);
    }
  };

  const loadProject = async () => {
    try {
      const token = getToken();
      if (!user) return;

      // Load stage data and project details in parallel
      const [stageResponse, projectResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}/stages/${stageNumber}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/projects?userId=${user.id}`, {
          headers: { "Content-Type": "application/json" },
        })
      ]);

      if (!stageResponse.ok) {
        throw new Error("Failed to load project");
      }

      const [fetchedStageData, projectsData] = await Promise.all([
        stageResponse.json(),
        projectResponse.ok ? projectResponse.json() : null
      ]);

      setStageData(fetchedStageData.stage);

      if (projectsData) {
        const currentProject = projectsData.projects.find((p: { id: string }) => p.id === projectId);
        setProject(currentProject);

        // Detect review mode: stage is completed AND project is completed
        const isReviewMode = fetchedStageData.stage?.completed && currentProject?.status === "completed";
        setIsReviewMode(isReviewMode);

        // If in review mode and has summary, load it
        if (isReviewMode && fetchedStageData.stage?.summary) {
          setStageSummary(fetchedStageData.stage.summary);
        }

        // Check for saved conversation
        if (fetchedStageData.stage?.responses?.messages && Array.isArray(fetchedStageData.stage.responses.messages)) {
          // Restore saved conversation
          setMessages(fetchedStageData.stage.responses.messages);
        } else if (!isReviewMode) {
          // Generate dynamic AI-powered greeting
          try {
            const greetingResponse = await fetch(
              `/api/projects/${projectId}/stages/${stageNumber}/greeting`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userId: user.id }),
              }
            );

            if (greetingResponse.ok) {
              const { greeting } = await greetingResponse.json();
              setMessages([{ role: "assistant", content: greeting }]);
            } else {
              // Fallback to static greeting if API fails
              const greeting = generateAgentGreeting(
                stageConfig.agentType,
                currentProject?.name,
                currentProject?.description
              );
              setMessages([{ role: "assistant", content: greeting }]);
            }
          } catch (error) {
            console.error("Failed to generate dynamic greeting:", error);
            // Fallback to static greeting
            const greeting = generateAgentGreeting(
              stageConfig.agentType,
              currentProject?.name,
              currentProject?.description
            );
            setMessages([{ role: "assistant", content: greeting }]);
          }
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading project:", error);
      setLoading(false);
    }
  };

  const loadPreviousStagesContext = async (token: string): Promise<string | null> => {
    try {
      let context = "";

      // Load Stage 1 summary if we're in Stage 2 or 3
      if (stageNumber >= 2) {
        const stage1Response = await fetch(
          `/api/projects/${projectId}/stages/1`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (stage1Response.ok) {
          const stage1Data = await stage1Response.json();
          if (stage1Data.stage?.completed && stage1Data.stage?.summary) {
            const summary = stage1Data.stage.summary.split("\n\n").slice(0, 3).join("\n\n");
            context += `\n**Requirements & Goals (Stage 1):**\n${summary.substring(0, 500)}...\n`;
          }
        }
      }

      // Load Stage 2 summary if we're in Stage 3
      if (stageNumber === 3) {
        const stage2Response = await fetch(
          `/api/projects/${projectId}/stages/2`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (stage2Response.ok) {
          const stage2Data = await stage2Response.json();
          if (stage2Data.stage?.completed && stage2Data.stage?.summary) {
            const summary = stage2Data.stage.summary.split("\n\n").slice(0, 3).join("\n\n");
            context += `\n**Tech Stack & Architecture (Stage 2):**\n${summary.substring(0, 500)}...\n`;
          }
        }
      }

      return context || null;
    } catch (error) {
      console.error("Error loading previous stages:", error);
      return null;
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending || isReviewMode) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);

    // Add user message
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);

    try {
      if (!user) return;

      // Call streaming API
      const response = await fetch("/api/claude/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
          agentType: stageConfig.agentType,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      setStreaming(true);
      setMessages([...newMessages, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  assistantMessage += data.content;
                  setMessages([
                    ...newMessages,
                    { role: "assistant", content: assistantMessage },
                  ]);
                }
                if (data.done) {
                  break;
                }
              } catch {
                // Ignore parsing errors
              }
            }
          }
        }
      }

      setStreaming(false);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
      setStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const generateStageSummary = async () => {
    setGeneratingSummary(true);

    try {
      const token = getToken();
      const userMessageCount = messages.filter(m => m.role === 'user').length;

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(
        `/api/projects/${projectId}/stages/${stageNumber}/generate-summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: user.id }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStageSummary(data.summary);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Summary generation failed:", errorData);
        // Fallback to basic summary
        const basicSummary = `# Stage ${stageNumber} Summary\n\nConversation completed with ${userMessageCount} user messages.`;
        setStageSummary(basicSummary);
      }
    } catch (error) {
      console.error("Failed to generate summary:", error);
      const userMessageCount = messages.filter(m => m.role === 'user').length;
      const basicSummary = `# Stage ${stageNumber} Summary\n\nConversation completed with ${userMessageCount} user messages.`;
      setStageSummary(basicSummary);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const requestStageSummary = async () => {
    // Validate minimum conversation depth
    const minMessages = {
      1: 10, // Stage 1: Requirements gathering needs substantial discussion
      2: 8,  // Stage 2: Architecture decisions need thorough exploration
      3: 8,  // Stage 3: UI/UX needs detailed planning
    };

    const requiredMessages = minMessages[stageNumber as keyof typeof minMessages];

    if (messages.length < requiredMessages) {
      alert(
        `Please have a more comprehensive conversation with the ${stageConfig.agentName}. ` +
        `This stage requires at least ${Math.ceil(requiredMessages / 2)} meaningful exchanges to ensure quality requirements. ` +
        `Current: ${Math.floor((messages.length - 1) / 2)} exchanges.`
      );
      return;
    }

    // Show summary modal and generate summary
    setShowSummary(true);
    await generateStageSummary();
  };

  const completeStage = async () => {
    setCompleting(true);

    try {
      const token = getToken();

      // Generate AI summary of the conversation
      const conversationSummary = messages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n\n");

      // Save stage completion
      const response = await fetch(
        `/api/projects/${projectId}/stages/${stageNumber}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            completed: true,
            summary: conversationSummary,
            responses: { messages },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to complete stage");
      }

      // Generate draft document after Stage 1
      if (stageNumber === 1) {
        try {
          await fetch(`/api/projects/${projectId}/generate-draft`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          // Don't block navigation if draft generation fails
        } catch (error) {
          console.error("Draft generation failed (non-blocking):", error);
        }
      }

      // Navigate to next stage or PRD generation
      if (stageNumber < 3) {
        router.push(`/projects/${projectId}/stage/${stageNumber + 1}`);
      } else {
        // All 3 stages complete - generate PRD
        router.push(`/projects/${projectId}/prd`);
      }
    } catch (error) {
      console.error("Error completing stage:", error);
      alert("Failed to complete stage. Please try again.");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stageConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invalid Stage</h1>
          <p className="text-muted-foreground mb-4">This stage does not exist.</p>
          <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 border-b border-border bg-muted/30 backdrop-blur-sm">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-4">
          <div className="flex flex-col gap-2">
            {/* Top row: Back button + Project name + Theme toggle */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(isReviewMode ? `/projects/${projectId}/prd` : "/dashboard")}
                  className="text-xs sm:text-sm flex-shrink-0"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">{isReviewMode ? "Back to PRD" : "Dashboard"}</span>
                  <span className="xs:hidden">Back</span>
                </Button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <h1 className="text-sm sm:text-base md:text-xl font-semibold truncate">{project?.name}</h1>
                    {isReviewMode && (
                      <span className="text-[10px] sm:text-xs font-medium px-1 sm:px-2 py-0.5 sm:py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap flex-shrink-0">
                        Review
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ThemeToggle />
            </div>

            {/* Bottom row: Stage info + Agent + Status */}
            <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
              <p className="text-muted-foreground truncate">
                Stage {stageNumber}: {stageConfig.name}
              </p>
              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Sparkles className={`h-3 w-3 sm:h-4 sm:w-4 text-${stageConfig.color}-500`} />
                  <span className="font-medium">{stageConfig.agentName}</span>
                </div>
                {isReviewMode && (
                  <div className="hidden sm:flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                    <Eye className="h-3 w-3" />
                    <span>Read Only</span>
                  </div>
                )}
                {!isReviewMode && autoSaving && (
                  <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Saving...</span>
                  </div>
                )}
                {!isReviewMode && !autoSaving && messages.length > 1 && (
                  <div className="hidden sm:flex items-center gap-1.5 text-green-600 dark:text-green-400">
                    <Check className="h-3 w-3" />
                    <span>Saved</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Progress - Sticky */}
      <div className="sticky top-[88px] sm:top-[96px] z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            {[
              { number: 1, name: "Requirements" },
              { number: 2, name: "Architecture" },
              { number: 3, name: "UI/UX" },
            ].map((stage) => {
              // In review mode, allow clicking any completed stage
              // In normal mode, only allow clicking previous stages
              const isClickable = isReviewMode
                ? stageData && stage.number !== stageNumber
                : stage.number < stageNumber;

              return (
                <div key={stage.number} className="flex items-center">
                  <button
                    onClick={() => {
                      if (isClickable) {
                        router.push(`/projects/${projectId}/stage/${stage.number}`);
                      }
                    }}
                    disabled={!isClickable}
                    className={`flex flex-col items-center ${
                      isClickable ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 text-xs sm:text-base ${
                        stage.number === stageNumber
                          ? "border-foreground bg-foreground text-background"
                          : stage.number < stageNumber || (isReviewMode && stageData)
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      {stage.number}
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs mt-1 ${
                        stage.number === stageNumber
                          ? "text-foreground font-medium"
                          : stage.number < stageNumber || (isReviewMode && stageData)
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      <span className="hidden sm:inline">{stage.name}</span>
                      <span className="sm:hidden">S{stage.number}</span>
                    </span>
                  </button>
                  {stage.number < 3 && (
                    <div
                      className={`w-8 sm:w-16 h-0.5 mb-4 sm:mb-5 ${
                        stage.number < stageNumber || (isReviewMode && stageData) ? "bg-green-500" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
          <div className="space-y-4 sm:space-y-6">
            {/* Show stage summary at top when in review mode */}
            {isReviewMode && stageSummary && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-100">
                    Stage Summary
                  </h3>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none text-blue-900 dark:text-blue-100 text-sm">
                  <div className="whitespace-pre-wrap">{stageSummary}</div>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base ${
                    message.role === "user"
                      ? "bg-foreground text-background"
                      : "bg-muted border border-border"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
            {streaming && (
              <div className="flex justify-start">
                <div className="bg-muted border border-border rounded-lg px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 max-w-4xl space-y-2 sm:space-y-3">
          {isReviewMode ? (
            /* Review Mode Navigation */
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/projects/${projectId}/prd`)}
                className="text-xs sm:text-sm"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Back to PRD
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/projects/${projectId}/stage/${stageNumber - 1}`)}
                  disabled={stageNumber === 1}
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Previous</span>
                  <span className="xs:hidden">Prev</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/projects/${projectId}/stage/${stageNumber + 1}`)}
                  disabled={stageNumber === 3}
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  Next
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            /* Normal Mode Input */
            <>
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message ${stageConfig.agentName}...`}
                  rows={1}
                  className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground resize-none overflow-hidden min-h-[38px] sm:min-h-[42px] max-h-[200px]"
                  disabled={sending || streaming}
                  style={{ height: "auto" }}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending || streaming}
                  size="lg"
                  className="px-3 sm:px-4"
                >
                  {sending || streaming ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  <span className="hidden xs:inline">Press Enter to send, Shift+Enter for new line</span>
                  <span className="xs:hidden">Enter to send</span>
                </p>
                {messages.length >= 3 && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    {(() => {
                      const minMessages = { 1: 10, 2: 8, 3: 8 };
                      const required = minMessages[stageNumber as keyof typeof minMessages];
                      const current = Math.floor((messages.length - 1) / 2);
                      const target = Math.ceil(required / 2);
                      const isReady = messages.length >= required;

                      return (
                        <>
                          <span className={`text-[10px] sm:text-xs text-center sm:text-left ${isReady ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                            {current}/{target} exchanges
                          </span>
                          <Button
                            onClick={requestStageSummary}
                            disabled={completing || sending || streaming}
                            variant={isReady ? "default" : "outline"}
                            size="sm"
                            className="text-xs sm:text-sm w-full sm:w-auto"
                          >
                            {completing ? (
                              <>
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                {stageNumber < 3 ? (
                                  <>
                                    <span className="hidden sm:inline">Complete & Continue to Stage {stageNumber + 1}</span>
                                    <span className="sm:hidden">Complete Stage {stageNumber}</span>
                                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                                  </>
                                ) : (
                                  <>
                                    <span className="hidden sm:inline">Complete & Generate PRD</span>
                                    <span className="sm:hidden">Complete & PRD</span>
                                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                                  </>
                                )}
                              </>
                            )}
                          </Button>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="border-b border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Stage {stageNumber} Summary</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Review your key takeaways and decide next steps
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSummary(false)}
                  disabled={completing}
                >
                  ✕
                </Button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {generatingSummary ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Generating summary...</p>
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap">{stageSummary}</div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="border-t border-border p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowSummary(false)}
                  disabled={completing || generatingSummary}
                  className="flex-1"
                >
                  Continue Refining
                </Button>
                <Button
                  onClick={completeStage}
                  disabled={completing || generatingSummary}
                  className="flex-1"
                >
                  {completing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Proceeding...
                    </>
                  ) : (
                    <>
                      {stageNumber < 3 ? `Proceed to Stage ${stageNumber + 1}` : "Generate PRD"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              {stageNumber === 1 && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  💡 A draft document will be generated after completing this stage
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
