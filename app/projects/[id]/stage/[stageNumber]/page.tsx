"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2, Send, Sparkles } from "lucide-react";
import { generateAgentGreeting } from "@/lib/services/claude.service";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  current_stage: number;
}

const STAGE_CONFIG = {
  1: {
    name: "Brainstorming & Requirements",
    agentType: "analyst" as const,
    agentName: "BMAD Analyst",
    description: "Define your project vision, goals, and core requirements",
    color: "blue",
  },
  2: {
    name: "Tech Stack & Architecture",
    agentType: "architect" as const,
    agentName: "BMAD Architect",
    description: "Select technologies and design your system architecture",
    color: "purple",
  },
  3: {
    name: "UI/UX Design",
    agentType: "pm" as const,
    agentName: "BMAD Product Manager",
    description: "Define user interface and experience requirements",
    color: "green",
  },
};

export default function StagePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const stageNumber = parseInt(params.stageNumber as string);

  const [project, setProject] = useState<ProjectData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [completing, setCompleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const stageConfig = STAGE_CONFIG[stageNumber as keyof typeof STAGE_CONFIG];

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadProject = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/auth/login");
        return;
      }

      const response = await fetch(`/api/projects/${projectId}/stages/${stageNumber}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load project");
      }

      const data = await response.json();

      // Load project details
      const projectResponse = await fetch("/api/projects", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (projectResponse.ok) {
        const projectsData = await projectResponse.json();
        const currentProject = projectsData.projects.find((p: any) => p.id === projectId);
        setProject(currentProject);

        // Initialize with agent greeting
        const greeting = generateAgentGreeting(
          stageConfig.agentType,
          currentProject?.name
        );
        setMessages([{ role: "assistant", content: greeting }]);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading project:", error);
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);

    // Add user message
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/auth/login");
        return;
      }

      // Call streaming API
      const response = await fetch("/api/claude/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          agentType: stageConfig.agentType,
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
              } catch (e) {
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

  const completeStage = async () => {
    if (messages.length < 3) {
      alert("Please have a conversation with the agent before completing this stage.");
      return;
    }

    setCompleting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/auth/login");
        return;
      }

      // Save conversation to stage
      const conversationSummary = messages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n\n");

      const response = await fetch(
        `/api/projects/${projectId}/stages/${stageNumber}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
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

      // Navigate to next stage or dashboard
      if (stageNumber < 3) {
        router.push(`/projects/${projectId}/stage/${stageNumber + 1}`);
      } else {
        // All stages complete - go to dashboard or PRD page
        router.push("/dashboard");
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
                  Stage {stageNumber}: {stageConfig.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className={`h-5 w-5 text-${stageConfig.color}-500`} />
              <span className="text-sm font-medium">{stageConfig.agentName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Progress */}
      <div className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((stage) => (
              <div key={stage} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    stage === stageNumber
                      ? "border-foreground bg-foreground text-background"
                      : stage < stageNumber
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {stage}
                </div>
                {stage < 3 && (
                  <div
                    className={`w-16 h-0.5 ${
                      stage < stageNumber ? "bg-green-500" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
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
        <div className="container mx-auto px-4 py-4 max-w-4xl space-y-3">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${stageConfig.agentName}...`}
              rows={1}
              className="flex-1 px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground resize-none"
              disabled={sending || streaming}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || sending || streaming}
              size="lg"
            >
              {sending || streaming ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line
            </p>
            {messages.length >= 3 && (
              <Button
                onClick={completeStage}
                disabled={completing || sending || streaming}
                variant="default"
                size="sm"
              >
                {completing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {stageNumber < 3 ? (
                      <>
                        Complete & Continue to Stage {stageNumber + 1}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Complete Final Stage
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
