"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function SetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [showMfaRecommendation, setShowMfaRecommendation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password set successfully. You can now access your account.");
      setPasswordUpdated(true);
      setShowMfaRecommendation(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to set password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle>Set your password</CardTitle>
          <CardDescription>
            Finish onboarding by creating your account password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {passwordUpdated ? (
            showMfaRecommendation ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                  <p className="text-sm font-medium">Recommended: enable MFA</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    For better account security, enable multi-factor authentication in Supabase
                    Account Settings → Security (Profile → Security).
                  </p>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link
                    href="https://supabase.com/dashboard/account/security"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Supabase Security Settings
                  </Link>
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setShowMfaRecommendation(false)}
                  >
                    Dismiss for now
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => {
                      router.push("/dashboard");
                      router.refresh();
                    }}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Password setup is complete. You can continue to your dashboard.
                </p>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    router.push("/dashboard");
                    router.refresh();
                  }}
                >
                  Continue to Dashboard
                </Button>
              </div>
            )
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Save Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
