"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Step = "form" | "verify";

export default function SignupPage() {
  const supabase = createClient();

  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password strength
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const passwordStrong = Object.values(passwordChecks).every(Boolean);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!passwordStrong) {
      setError("Please meet all password requirements.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: displayName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setStep("verify");
    setLoading(false);
  }

  if (step === "verify") {
    return (
      <AuthCard
        title="Check your email"
        subtitle={`We sent a verification link to ${email}`}
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-violet-400" />
          <p className="text-sm text-zinc-400">
            Click the link in your email to activate your account. You can
            close this tab.
          </p>
          <Link
            href="/login"
            className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Back to login
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start making cinematic music videos"
    >
      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        {error && <AuthAlert type="error" message={error} />}

        <Input
          id="display_name"
          type="text"
          label="Display Name"
          placeholder="Your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoComplete="name"
          required
        />

        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <div className="flex flex-col gap-1.5">
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-[34px] text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Password strength indicators */}
          {password.length > 0 && (
            <ul className="flex flex-col gap-1 mt-1">
              {[
                { check: passwordChecks.length, label: "At least 8 characters" },
                { check: passwordChecks.uppercase, label: "One uppercase letter" },
                { check: passwordChecks.number, label: "One number" },
              ].map(({ check, label }) => (
                <li
                  key={label}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${
                    check ? "text-green-400" : "text-zinc-500"
                  }`}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button type="submit" loading={loading} className="mt-2">
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
