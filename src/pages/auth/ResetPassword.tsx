import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Logo = () => (
  <div className="flex flex-col items-center mb-7">
    <div className="h-12 w-12 rounded-2xl overflow-hidden shadow-md mb-4">
      <img src="/logo.png" alt="Elite Veo" className="h-full w-full object-cover" />
    </div>
  </div>
);

const ResetPassword = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetError, setResetError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase places the recovery token in the URL hash and exchanges it
    // automatically. Wait for either a session or a recovery event.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      else if (!window.location.hash.includes("type=recovery")) {
        setInvalid(true);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    if (!newPassword) { setResetError("Please enter a new password."); return; }
    if (newPassword.length < 6) { setResetError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setResetError("Passwords do not match."); return; }
    setLoading(true);
    const { error } = await updatePassword(newPassword);
    setLoading(false);
    if (error) { setResetError(error); return; }
    setDone(true);
  };

  if (invalid) {
    return (
      <AuthLayout>
        <Logo />
        <div className="text-center">
          <p className="text-xl font-bold text-foreground mb-1">Invalid reset link</p>
          <p className="text-sm text-muted-foreground mb-6">
            This password reset link is invalid or has expired.
          </p>
          <button
            onClick={() => navigate("/forgot-password")}
            className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Request a new link
          </button>
        </div>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center gap-5">
          <div className="h-12 w-12 rounded-2xl overflow-hidden shadow-md">
            <img src="/logo.png" alt="Elite Veo" className="h-full w-full object-cover" />
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground mb-1">Password reset!</p>
            <p className="text-sm text-muted-foreground">Your password has been updated successfully.</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Continue to App
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Logo />
      <div className="text-center -mt-3 mb-7">
        <h1 className="text-xl font-bold text-foreground">Set new password</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose a strong password for your account</p>
      </div>
      <form onSubmit={handleResetSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">New password</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              autoFocus
              className="w-full rounded-2xl border border-border bg-secondary/30 px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
            />
            <button type="button" onClick={() => setShowNew((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Confirm password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              autoComplete="new-password"
              className="w-full rounded-2xl border border-border bg-secondary/30 px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
            />
            <button type="button" onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {resetError && <p className="text-xs text-destructive px-1">{resetError}</p>}
        {!ready && (
          <p className="text-xs text-muted-foreground px-1">Verifying reset link…</p>
        )}
        <button
          type="submit"
          disabled={loading || !ready}
          className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Resetting…" : "Reset Password"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
