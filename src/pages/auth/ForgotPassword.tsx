import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Eye, EyeOff, CheckCircle2, RefreshCw } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import OtpInput from "@/components/auth/OtpInput";

type Step = "email" | "otp" | "reset" | "done";

const generateOtp = () =>
  Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join("");

const Logo = () => (
  <div className="flex flex-col items-center mb-7">
    <div className="h-12 w-12 rounded-2xl overflow-hidden shadow-md mb-4">
      <img src="/logo.png" alt="Elite Veo" className="h-full w-full object-cover" />
    </div>
  </div>
);

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [resending, setResending] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetError, setResetError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    if (!email.trim()) { setEmailError("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setOtpCode(generateOtp());
    setLoading(false);
    setStep("otp");
  };

  const handleResend = async () => {
    setResending(true);
    setOtpError(false);
    await new Promise((r) => setTimeout(r, 700));
    setOtpCode(generateOtp());
    setResending(false);
  };

  const handleOtpComplete = (value: string) => {
    if (value.length < 8) return;
    if (value !== otpCode) { setOtpError(true); return; }
    setOtpError(false);
    setStep("reset");
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    if (!newPassword) { setResetError("Please enter a new password."); return; }
    if (newPassword.length < 6) { setResetError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setResetError("Passwords do not match."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    setStep("done");
  };

  /* ── Step: email ── */
  if (step === "email") return (
    <AuthLayout backLabel="Back to sign in" onBack={() => navigate("/login")}>
      <Logo />
      <div className="text-center -mt-3 mb-7">
        <h1 className="text-xl font-bold text-foreground">Forgot password?</h1>
        <p className="text-sm text-muted-foreground mt-1">Enter your email and we'll send you a code</p>
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
          {loading ? "Sending code…" : "Send OTP Code"}
        </button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        Remember your password?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">Sign In</Link>
      </p>
    </AuthLayout>
  );

  /* ── Step: otp ── */
  if (step === "otp") return (
    <AuthLayout backLabel="Back" onBack={() => { setStep("email"); setOtpError(false); }}>
      <Logo />
      <div className="text-center -mt-3 mb-7">
        <h1 className="text-xl font-bold text-foreground">Enter your code</h1>
        <p className="text-sm text-muted-foreground mt-1">We sent an 8-digit code to</p>
        <p className="text-sm font-semibold text-foreground mt-0.5 break-all">{email}</p>
      </div>

      <div className="rounded-2xl border border-primary/25 bg-primary/8 px-4 py-3 mb-6 text-center">
        <p className="text-[10px] font-semibold text-primary/70 uppercase tracking-widest mb-1.5">Test code</p>
        <p className="text-xl font-bold tracking-[0.3em] text-primary">{otpCode}</p>
      </div>

      <OtpInput
        key={otpCode}
        onComplete={handleOtpComplete}
        onChange={(v) => { if (otpError && v.length < 8) setOtpError(false); }}
        error={otpError}
      />

      {otpError && (
        <p className="text-xs text-destructive text-center mt-3">Incorrect code. Please try again.</p>
      )}

      <div className="flex items-center justify-center gap-1.5 mt-6">
        <span className="text-sm text-muted-foreground">Didn't receive it?</span>
        <button
          onClick={handleResend}
          disabled={resending}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline disabled:opacity-50"
        >
          {resending && <RefreshCw className="h-3 w-3 animate-spin" />}
          {resending ? "Resending…" : "Resend code"}
        </button>
      </div>
    </AuthLayout>
  );

  /* ── Step: reset ── */
  if (step === "reset") return (
    <AuthLayout backLabel="Back" onBack={() => setStep("otp")}>
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

  /* ── Step: done ── */
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
          onClick={() => navigate("/login")}
          className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Back to Sign In
        </button>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
