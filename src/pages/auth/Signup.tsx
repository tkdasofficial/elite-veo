import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/context/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";
import OtpInput from "@/components/auth/OtpInput";

const Signup = () => {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, verifySignupOtp, resendSignupOtp } = useAuth();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [otpStage, setOtpStage] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const pendingPrompt = sessionStorage.getItem("pending_prompt");

  const startResendCooldown = () => {
    setResendSeconds(45);
    const t = setInterval(() => {
      setResendSeconds((s) => {
        if (s <= 1) { clearInterval(t); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error, needsConfirmation } = await signUp({
      name,
      username: username.trim() || undefined,
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(
        /already registered|already exists/i.test(error)
          ? "An account with this email already exists. Try signing in."
          : error
      );
      return;
    }
    if (needsConfirmation) {
      setOtpStage(true);
      startResendCooldown();
    } else {
      navigate("/");
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setOtpError("");
    setOtpVerifying(true);
    const { error } = await verifySignupOtp(email, code);
    setOtpVerifying(false);
    if (error) {
      setOtpError(/expired|invalid/i.test(error) ? "Invalid or expired code. Try again." : error);
      return;
    }
    navigate("/");
  };

  const handleResend = async () => {
    if (resendSeconds > 0) return;
    setOtpError("");
    const { error } = await resendSignupOtp(email);
    if (error) { setOtpError(error); return; }
    startResendCooldown();
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error);
      setGoogleLoading(false);
    }
  };

  if (otpStage) {
    return (
      <AuthLayout backLabel="Back" onBack={() => setOtpStage(false)}>
        <div className="flex flex-col items-center text-center gap-5">
          <div className="h-12 w-12 rounded-2xl overflow-hidden shadow-md">
            <img src="/logo.png" alt="Elite Veo" className="h-full w-full object-cover" />
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground mb-1">Verify your email</p>
            <p className="text-sm text-muted-foreground">
              Enter the 8-digit code we sent to{" "}
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
            onClick={handleResend}
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

  return (
    <AuthLayout backLabel="Back to chat" onBack={() => navigate("/")}>
      <div className="flex flex-col items-center mb-7">
        <div className="h-12 w-12 rounded-2xl overflow-hidden shadow-md mb-4">
          <img src="/logo.png" alt="Elite Veo" className="h-full w-full object-cover" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Create your account</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pendingPrompt ? "Sign up to create your video" : "Start creating with AI"}
        </p>
      </div>

      {pendingPrompt && (
        <div className="rounded-2xl border border-border/40 bg-secondary/20 px-4 py-3 mb-5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Your video idea</p>
          <p className="text-sm text-foreground line-clamp-2">{pendingPrompt}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading || loading}
        className="w-full h-11 rounded-2xl border border-border bg-secondary/30 flex items-center justify-center gap-2.5 text-sm font-semibold text-foreground hover:bg-secondary/50 disabled:opacity-50 transition-colors mb-4"
      >
        <FcGoogle className="h-5 w-5" />
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 border-t border-border/40" />
        <span className="text-[11px] text-muted-foreground">or sign up with email</span>
        <div className="flex-1 border-t border-border/40" />
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Display name</label>
          <input
            type="text"
            data-testid="input-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Johnson"
            autoComplete="name"
            className="w-full rounded-2xl border border-border bg-secondary/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Username <span className="text-muted-foreground/50">(optional)</span>
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s/g, "").toLowerCase())}
            placeholder="alexj"
            autoComplete="username"
            className="w-full rounded-2xl border border-border bg-secondary/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
          <input
            type="email"
            data-testid="input-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full rounded-2xl border border-border bg-secondary/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              data-testid="input-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              className="w-full rounded-2xl border border-border bg-secondary/30 px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && <p data-testid="text-error" className="text-xs text-destructive px-1">{error}</p>}

        <button
          type="submit"
          data-testid="button-signup"
          disabled={loading || googleLoading}
          className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors mt-1"
        >
          {loading ? "Sending code…" : "Create Account"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-5">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">Sign In</Link>
      </p>
      <p className="text-center text-[11px] text-muted-foreground/40 mt-5">
        By creating an account you agree to our Terms of Service
      </p>
    </AuthLayout>
  );
};

export default Signup;
