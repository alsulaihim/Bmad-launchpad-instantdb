"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function OnboardingPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
    }
  };

  useEffect(() => {
    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const testApiKey = async () => {
    if (!apiKey.trim()) {
      setError("Please enter an API key");
      return;
    }

    if (!apiKey.startsWith("sk-ant-api03-")) {
      setError(
        "Invalid API key format. Anthropic keys start with 'sk-ant-api03-'"
      );
      return;
    }

    setTesting(true);
    setError(null);

    try {
      const response = await fetch("/api/anthropic/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid API key");
        return;
      }

      setSuccess(true);
      setTimeout(() => saveAndContinue(), 1500);
    } catch {
      setError("Failed to validate API key. Please try again.");
    } finally {
      setTesting(false);
    }
  };

  const saveAndContinue = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/auth/login");
        return;
      }

      const response = await fetch("/api/user/api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ apiKey }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save API key");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-block h-12 w-12 bg-foreground rounded mb-4" />
          <h1 className="text-3xl font-bold">Connect Your Anthropic Account</h1>
          <p className="text-muted-foreground text-lg">
            To use the BMAD Framework with Claude AI, you&apos;ll need an Anthropic
            API key
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-muted/30 border border-border rounded-lg p-8 space-y-6">
          {/* Instructions */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">How to get your API key:</h2>
            <ol className="space-y-3 text-muted-foreground">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">1.</span>
                <span>
                  Go to{" "}
                  <a
                    href="https://console.anthropic.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:underline inline-flex items-center gap-1"
                  >
                    console.anthropic.com
                    <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  and sign up or log in
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">2.</span>
                <span>Navigate to Settings → API Keys</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">3.</span>
                <span>Click &quot;Create Key&quot; and name it &quot;BMAD-Launchpad&quot;</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">4.</span>
                <span>Copy the key and paste it below</span>
              </li>
            </ol>
          </div>

          {/* API Key Input */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="space-y-2">
              <label
                htmlFor="apiKey"
                className="text-sm font-medium text-foreground"
              >
                Anthropic API Key
              </label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setError(null);
                  setSuccess(false);
                }}
                placeholder="sk-ant-api03-..."
                className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-foreground font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Your API key is encrypted and stored securely. It&apos;s only used to
                make Claude API calls on your behalf.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                API key validated successfully! Redirecting...
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={testApiKey}
                disabled={testing || loading || success || !apiKey}
                variant="outline"
                className="flex-1"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Valid
                  </>
                ) : (
                  "Test Connection"
                )}
              </Button>

              <Button
                onClick={saveAndContinue}
                disabled={!success || loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-4 space-y-2">
            <h3 className="font-semibold text-sm text-blue-600 dark:text-blue-400">
              💡 Cost Information
            </h3>
            <p className="text-sm text-muted-foreground">
              Using the BMAD Framework typically costs <strong>$0.10 - $0.50</strong> per
              complete project in Claude API usage. You pay Anthropic directly
              for your usage.
            </p>
          </div>
        </div>

        {/* Skip Option (for testing) */}
        <div className="text-center text-sm text-muted-foreground">
          Want to explore first?{" "}
          <button
            onClick={() => router.push("/dashboard")}
            className="text-foreground hover:underline font-medium"
          >
            Skip for now
          </button>
          <br />
          <span className="text-xs">(You&apos;ll need to add it later to use BMAD)</span>
        </div>
      </div>
    </div>
  );
}
