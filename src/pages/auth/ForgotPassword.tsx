import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ShieldCheck, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import { useAuth } from "@/context/AuthContext";
import OtpInput from "@/components/auth/OtpInput";

const Logo = () => (
  <div className="flex flex-col items-center mb-7">
    <div className="h-12 w-12 rounded-2xl overflow-hidden shadow-md mb-4">
      <img src="/logo.png" alt="Elite Veo" className="h-full w-full object-cover" />
    </div>
  </div>
);

type Stage = "email" | "otp" | "password" | "done";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { resetPassword, verifyRecoveryOtp, updatePassword } = useAuth();

  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  const [otpError, setOtpError] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetError, setResetError] = useState("");

  const startResendCooldown = () => {
    setResendSeconds(45);
    const t = setInterval(() => {
      setResendSeconds((s) => {
        if (s <= 1) { clearInterval(t); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    if (!email.trim()) { setEmailError("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) { setEmailError(error); return; }
    setStage("otp");
    startResendCooldown();
  };

  const handleVerifyOtp = async (code: string) => {
    setOtpError("");
    setOtpVerifying(true);
    const { error } = await verifyRecoveryOtp(email, code);
    setOtpVerifying(false);
    if (error) {
      setOtpError(/expired|invalid/i.test(error) ? "Invalid or expired code. Try again." : error);
      return;
    }
    setStage("password");
  };

  const handleResendOtp = async () => {
    if (resendSeconds > 0) return;
    setOtpError("");
    const { error } = await resetPassword(email);
    if (error) { setOtpError(error); return; }
    startResendCooldown();
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    if (!newPassword) { setResetError("Please enter a new password."); return; }
    if (newPassword.length < 6) { setResetError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setResetError("Passwords do not match."); return; }
    setLoading(true);
    const { error } = await updatePassword(newPassword);
    setLoading(false);
    if (error) { setResetError(error); return; }
    setStage("done");
  };

  /* ─── DONE ─── */
  if (stage === "done") {
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

  /* ─── NEW PASSWORD ─── */
  if (stage === "password") {
    return (
      <AuthLayout backLabel="Back" onBack={() => setStage("otp")}>
        <Logo />
        <div className="text-center -mt-3 mb-7">
          <h1 className="text-xl font-bold text-foreground">Set new password</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose a strong password for your account</p>
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
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
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Resetting…" : "Reset Password"}
          </button>
        </form>
      </AuthLayout>
    );
  }

  /* ─── OTP ─── */
  if (stage === "otp") {
    return (
      <AuthLayout backLabel="Back" onBack={() => setStage("email")}>
        <div className="flex flex-col items-center text-center gap-5">
          <div className="h-12 w-12 rounded-2xl overflow-hidden shadow-md">
            <img src="/logo.png" alt="Elite Veo" className="h-full w-full object-cover" />
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground mb-1">Enter reset code</p>
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-foreground break-all">{email}</span>
            </p>
          </div>
          <div className="w-full">
            <OtpInput
              length={8}
              onComplete={handleVerifyOtp}
              disabled={otpVerifying}
              error={!!otpError}
            />
            {otpError && <p className="text-xs text-destructive mt-3">{otpError}</p>}
            {otpVerifying && <p className="text-xs text-muted-foreground mt-3">Verifying…</p>}
          </div>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendSeconds > 0}
            className="text-sm text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
          >
            {resendSeconds > 0
              ? `Resend code in ${resendSeconds}s`
              : "Didn't get it? Resend code"}
          </button>
        </div>
      </AuthLayout>
    );
  }

  /* ─── EMAIL ─── */
  return (
    <AuthLayout backLabel="Back to sign in" onBack={() => navigate("/login")}>
      <Logo />
      <div className="text-center -mt-3 mb-7">
        <h1 className="text-xl font-bold text-foreground">Forgot password?</h1>
        <p className="text-sm text-muted-foreground mt-1">Enter your email and we'll send you a verification code</p>
      </div>
      <form onSubmit={handleEmailSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              className="w-full rounded-2xl border border-border bg-secondary/30 pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
            />
          </div>
          {emailError && <p className="text-xs text-destructive mt-1.5 px-1">{emailError}</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Sending code…" : "Send Verification Code"}
        </button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        Remember your password?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">Sign In</Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPassword;
