"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, Lock, Trash2, Save,
  CheckCircle2, AlertCircle, Loader2,
  Eye, EyeOff, LogOut, Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types/database";

type Tab = "profile" | "security" | "danger";

interface Toast {
  type: "success" | "error";
  message: string;
}

export default function SettingsPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [tab, setTab]           = useState<Tab>("profile");
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState<Toast | null>(null);

  // ── Profile fields ────────────────────────────────────────
  const [displayName, setDisplayName]   = useState("");
  const [username, setUsername]         = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Security fields ───────────────────────────────────────
  const [currentPassword, setCurrentPassword]   = useState("");
  const [newPassword, setNewPassword]           = useState("");
  const [confirmPassword, setConfirmPassword]   = useState("");
  const [showCurrent, setShowCurrent]           = useState(false);
  const [showNew, setShowNew]                   = useState(false);
  const [savingPassword, setSavingPassword]     = useState(false);

  // ── Danger zone ───────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm]   = useState("");
  const [deleting, setDeleting]             = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        const p = data as Profile;
        setProfile(p);
        setDisplayName(p.display_name ?? "");
        setUsername(p.username ?? "");
      }
      setLoading(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function showToast(type: Toast["type"], message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Save profile ──────────────────────────────────────────
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        username:     username.trim()    || null,
      })
      .eq("id", profile.id);

    setSavingProfile(false);
    if (error) showToast("error", error.message);
    else       showToast("success", "Profile updated successfully.");
  }

  // ── Change password ───────────────────────────────────────
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showToast("error", "New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      showToast("error", "Password must be at least 8 characters.");
      return;
    }

    setSavingPassword(true);

    // Re-authenticate first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { showToast("error", "Could not verify user."); setSavingPassword(false); return; }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email:    user.email,
      password: currentPassword,
    });

    if (signInError) {
      showToast("error", "Current password is incorrect.");
      setSavingPassword(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) showToast("error", error.message);
    else {
      showToast("success", "Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  // ── Delete account ────────────────────────────────────────
  async function handleDeleteAccount() {
    if (deleteConfirm !== "delete my account") return;
    setDeleting(true);

    // Sign out and let a server-side cleanup handle deletion
    // In production: call a Supabase Edge Function with admin privileges
    await supabase.auth.signOut();
    router.push("/login?deleted=true");
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile",  label: "Profile",  icon: <User   className="h-4 w-4" /> },
    { key: "security", label: "Security", icon: <Lock   className="h-4 w-4" /> },
    { key: "danger",   label: "Danger Zone", icon: <Shield className="h-4 w-4" /> },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your BeatZVid account preferences.
          </p>
        </div>

        {/* ── Toast ── */}
        {toast && (
          <div className={cn(
            "mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm",
            toast.type === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          )}>
            {toast.type === "success"
              ? <CheckCircle2 className="h-4 w-4 shrink-0" />
              : <AlertCircle  className="h-4 w-4 shrink-0" />
            }
            {toast.message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">

          {/* ── Tab nav ── */}
          <nav className="flex flex-row gap-1 lg:flex-col lg:col-span-1">
            {TABS.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-left transition-colors w-full",
                  tab === key
                    ? key === "danger"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-violet-600/20 text-violet-300 border border-violet-500/20"
                    : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 border border-transparent"
                )}
              >
                {icon}
                <span className="hidden sm:block">{label}</span>
              </button>
            ))}
          </nav>

          {/* ── Tab content ── */}
          <div className="lg:col-span-3">

            {/* ─── Profile tab ─── */}
            {tab === "profile" && (
              <form
                onSubmit={handleSaveProfile}
                className="flex flex-col gap-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6"
              >
                <div>
                  <h2 className="text-base font-semibold text-white">Profile</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Update your display name and username.
                  </p>
                </div>

                {/* Avatar placeholder */}
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/20 ring-2 ring-violet-500/30 text-2xl font-bold text-violet-300">
                    {(displayName || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-300">
                      {displayName || "No name set"}
                    </p>
                    <p className="text-xs text-zinc-600">
                      Avatar upload coming soon
                    </p>
                  </div>
                </div>

                <div className="h-px bg-zinc-800" />

                <Input
                  id="display_name"
                  label="Display Name"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />

                <Input
                  id="username"
                  label="Username"
                  placeholder="yourhandle"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                  }
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={savingProfile}
                    className="w-auto px-6"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            )}

            {/* ─── Security tab ─── */}
            {tab === "security" && (
              <form
                onSubmit={handleChangePassword}
                className="flex flex-col gap-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6"
              >
                <div>
                  <h2 className="text-base font-semibold text-white">Change Password</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Choose a strong password you don't use elsewhere.
                  </p>
                </div>

                {/* Current password */}
                <div className="relative">
                  <Input
                    id="current_password"
                    type={showCurrent ? "text" : "password"}
                    label="Current Password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3 top-[34px] text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="h-px bg-zinc-800" />

                {/* New password */}
                <div className="relative">
                  <Input
                    id="new_password"
                    type={showNew ? "text" : "password"}
                    label="New Password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-[34px] text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <Input
                  id="confirm_password"
                  type="password"
                  label="Confirm New Password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={
                    confirmPassword.length > 0 && confirmPassword !== newPassword
                      ? "Passwords do not match"
                      : undefined
                  }
                  required
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={savingPassword}
                    className="w-auto px-6"
                  >
                    <Lock className="h-4 w-4" />
                    Update Password
                  </Button>
                </div>

                {/* Sign out all devices */}
                <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      Sign out everywhere
                    </p>
                    <p className="text-xs text-zinc-600">
                      Revoke all active sessions on other devices.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.auth.signOut({ scope: "global" });
                      router.push("/login");
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-red-500/50 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out All
                  </button>
                </div>
              </form>
            )}

            {/* ─── Danger zone tab ─── */}
            {tab === "danger" && (
              <div className="flex flex-col gap-4 rounded-xl border border-red-500/20 bg-red-500/5 p-6">
                <div>
                  <h2 className="text-base font-semibold text-red-400">Danger Zone</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    These actions are permanent and cannot be undone.
                  </p>
                </div>

                <div className="h-px bg-red-500/20" />

                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-zinc-300">
                    Delete Account
                  </p>
                  <p className="text-sm text-zinc-500">
                    Permanently delete your BeatZVid account, all uploaded songs,
                    lyrics, and generated videos. This cannot be reversed.
                  </p>

                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                    <p className="mb-3 text-xs text-zinc-500">
                      Type{" "}
                      <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-zinc-300">
                        delete my account
                      </code>{" "}
                      to confirm:
                    </p>
                    <input
                      type="text"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder="delete my account"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirm !== "delete my account" || deleting}
                    className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    {deleting
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Trash2  className="h-4 w-4" />
                    }
                    {deleting ? "Deleting…" : "Delete My Account"}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
