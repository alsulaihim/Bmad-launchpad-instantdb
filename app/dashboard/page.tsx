"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Plus,
  FolderOpen,
  Clock,
  CheckCircle,
  Archive,
  AlertCircle,
  Loader2,
  LogOut,
  FileText,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "in_progress" | "completed" | "archived";
  current_stage: number;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [checkingApiKey, setCheckingApiKey] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    checkAuthAndApiKey();
    fetchProjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthAndApiKey = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Check if user has API key
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      try {
        const response = await fetch("/api/user/api-key", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setHasApiKey(data.hasApiKey);
        }
      } catch {
        console.error("Failed to check API key status");
      }
    }

    setCheckingApiKey(false);
  };

  const fetchProjects = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch("/api/projects", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch {
      console.error("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    setCreating(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/projects/${data.project.id}/stage/1`);
      }
    } catch {
      console.error("Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "archived":
        return <Archive className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStageText = (stage: number) => {
    const stages = {
      1: "Brainstorming & Requirements",
      2: "Tech Stack & Architecture",
      3: "UI/UX Design",
    };
    return stages[stage as keyof typeof stages] || "Unknown";
  };

  if (loading || checkingApiKey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-foreground rounded" />
            <span className="text-xl font-semibold">BMAD Launchpad</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* API Key Warning */}
        {!hasApiKey && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-600 dark:text-yellow-400">
                Anthropic API Key Required
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Connect your Anthropic account to start using the BMAD Framework.
              </p>
              <Button
                size="sm"
                onClick={() => router.push("/onboarding")}
                className="mt-3"
              >
                Connect Now
              </Button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage your BMAD Framework projects
            </p>
          </div>
          <Button
            onClick={() => setShowNewProject(true)}
            disabled={!hasApiKey}
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Project
          </Button>
        </div>

        {/* New Project Modal */}
        {showNewProject && (
          <div className="mb-6 bg-muted/30 border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create New Project</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewProject(false)}
              >
                Cancel
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="E.g., E-commerce Platform"
                  className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Description (Optional)
                </label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Brief description of your project..."
                  rows={3}
                  className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-foreground resize-none"
                />
              </div>

              <Button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim() || creating}
                className="w-full"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create & Start BMAD Workflow"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first project to get started with the BMAD Framework
            </p>
            {hasApiKey && (
              <Button onClick={() => setShowNewProject(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-muted/30 border border-border rounded-lg p-6 hover:border-foreground/50 transition-colors space-y-4"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  {getStatusIcon(project.status)}
                </div>

                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Current Stage:</span>
                    <span className="font-medium">Stage {project.current_stage}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getStageText(project.current_stage)}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {project.status === "completed" ? (
                    <Button
                      onClick={() => router.push(`/projects/${project.id}/prd`)}
                      className="flex-1"
                      size="sm"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View PRD
                    </Button>
                  ) : (
                    <Button
                      onClick={() =>
                        router.push(`/projects/${project.id}/stage/${project.current_stage}`)
                      }
                      className="flex-1"
                      size="sm"
                    >
                      Continue
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
