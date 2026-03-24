"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package } from "lucide-react";
import { toast } from "sonner";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        });
        if (error) throw error;
        setConfirmationSent(true);
        toast.success(t("login.confirmationEmailSent"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success(t("login.welcomeBack"));
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("login.genericError");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-400/10">
            <Package className="h-8 w-8 text-gold-400" />
          </div>
          <h1 className="text-3xl font-bold">
            <span className="text-gold-400">Asset</span>Track
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("login.subtitle")}
          </p>
        </div>

        {confirmationSent && (
          <Card className="mb-4 border-gold-400/30 bg-gold-400/5">
            <CardContent className="flex items-start gap-3 p-4">
              <span className="text-2xl">✉️</span>
              <div>
                <p className="font-medium text-gold-400">{t("login.checkEmail")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("login.checkEmailMessage")} <strong>{email}</strong>.{" "}
                  {t("login.checkEmailMessageEnd")}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmationSent(false);
                    setIsSignUp(false);
                  }}
                  className="mt-2 text-sm text-gold-400 hover:underline"
                >
                  ← {t("login.backToSignIn")}
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>{isSignUp ? t("login.createAccount") : t("login.signIn")}</CardTitle>
            <CardDescription>
              {isSignUp
                ? t("login.registerDescription")
                : t("login.loginDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("login.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bank.uz"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("login.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? isSignUp
                    ? t("login.creatingAccount")
                    : t("login.signingIn")
                  : isSignUp
                  ? t("login.signUp")
                  : t("login.signIn")}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {isSignUp ? (
                <>
                  {t("login.hasAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className="text-gold-400 hover:underline"
                  >
                    {t("login.signIn")}
                  </button>
                </>
              ) : (
                <>
                  {t("login.noAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="text-gold-400 hover:underline"
                  >
                    {t("login.signUp")}
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          CBU Coding Hackathon 2026 — Team NEWBIES
        </p>
      </div>
    </div>
  );
}
