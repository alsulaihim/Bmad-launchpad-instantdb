"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/instantdb/client";
import { id } from "@instantdb/react";
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
  Trash2,
  MoreVertical,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { isLoading: authLoading, user, error: authError } = db.useAuth();
  
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Query projects
  const { data: projectData, isLoading: projectsLoading } = db.useQuery(
    user ? {
      projects: {
        $: {
          where: { "owner.id": user.id },
          order: { serverCreatedAt: "desc" }
        }
      }
    } : null
  );

  // Query profile for API key
  const { data: profileData, isLoading: profileLoading, error: profileError } = db.useQuery(
    user ? {
      profiles: {
        $: { where: { id: user.id } }
      }
    } : null
  );

  // Debug logging
  if (profileData && user) {
    console.log("Profile query result:", {
      userId: user.id,
      profiles: profileData.profiles,
      hasKey: !!profileData.profiles?.[0]?.anthropic_api_key
    });
  }

  const hasApiKey = !!profileData?.profiles?.[0]?.anthropic_api_key;
  const projects = projectData?.projects || [];
  const loading = authLoading || projectsLoading || profileLoading;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    setCreating(true);
    setCreateError(null);

    try {
      const projectId = id();
      const now = new Date().toISOString();
      
      // Create project and link to user
      await db.transact([
        db.tx.projects[projectId].update({
          name: newProjectName,
          description: newProjectDescription || "",
          status: "in_progress",
          current_stage: 1,
          created_at: now,
          updated_at: now,
        }).link({ owner: user.id }),
        
        // Create initial stages
        ...[1, 2, 3].map(num => {
            const stageId = id();
            const stageNames = {
                1: "Brainstorming & Requirements",
                2: "Tech Stack & Architecture",
                3: "UI/UX Design"
            };
            return db.tx.project_stages[stageId].update({
                stage_number: num,
                stage_name: stageNames[num as 1|2|3],
                responses: {},
                summary: "",
                completed: false,
                completed_at: "",
                created_at: now,
                updated_at: now,
            }).link({ project: projectId });
        })
      ]);

      // Clear form and close modal
      setNewProjectName("");
      setNewProjectDescription("");
      setShowNewProject(false);

      router.push(`/projects/${projectId}/stage/1`);
    } catch (error) {
      console.error("Failed to create project", error);
      setCreateError("Failed to create project. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleSignOut = async () => {
    await db.auth.signOut();
    router.push("/");
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!user) return;

    setDeleting(true);
    try {
      // Delete using client SDK for immediate cache update
      await db.transact([
        db.tx.projects[projectId].delete()
      ]);

      // Close the modal
      setDeleteConfirm(null);

      // The project list will update automatically via InstantDB reactivity
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project. Please try again.");
    } finally {
      setDeleting(false);
    }
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

  if (loading) {
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

              {createError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-600 dark:text-red-400">
                  {createError}
                </div>
              )}

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
            {projects.map((project: any) => (
              <div
                key={project.id}
                className="bg-muted/30 border border-border rounded-lg p-6 hover:border-foreground/50 transition-colors space-y-4"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(project.status)}
                    <button
                      onClick={() => setDeleteConfirm(project.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                      title="Delete project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Delete Project</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Are you sure you want to delete this project? This action cannot be undone.
                  All stages, conversations, and associated data will be permanently removed.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteProject(deleteConfirm)}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
