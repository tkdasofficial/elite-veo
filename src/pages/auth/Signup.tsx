import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";
import OtpInput from "@/components/auth/OtpInput";

type Step = "form" | "otp";

const generateOtp = () =>
  Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join("");

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [resending, setResending] = useState(false);

  const pendingPrompt = sessionStorage.getItem("pending_prompt");

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
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

  const handleOtpComplete = async (value: string) => {
    if (value.length < 8) return;
    if (value !== otpCode) { setOtpError(true); return; }
    setOtpError(false);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    signup(name, email, password);
    navigate("/");
  };

  if (step === "otp") {
    return (
      <AuthLayout backLabel="Back" onBack={() => { setStep("form"); setOtpError(false); }}>
        <div className="flex flex-col items-center mb-7">
          <div className="h-12 w-12 rounded-2xl overflow-hidden shadow-md mb-4">
            <img src="/logo.png" alt="Elite Veo" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Verify your email</h1>
          <p className="text-sm text-muted-foreground mt-1">We sent an 8-digit code to</p>
          <p className="text-sm font-semibold text-foreground mt-0.5 truncate max-w-full">{email}</p>
        </div>

        <div className="rounded-2xl border border-primary/25 bg-primary/8 px-4 py-3 mb-6 text-center">
          <p className="text-[10px] font-semibold text-primary/70 uppercase tracking-widest mb-1.5">Test code</p>
          <p className="text-xl font-bold tracking-[0.3em] text-primary">{otpCode}</p>
        </div>

        <OtpInput
          key={otpCode}
          onComplete={handleOtpComplete}
          onChange={(v) => { if (otpError && v.length < 8) setOtpError(false); }}
          disabled={loading}
          error={otpError}
        />

        {otpError && (
          <p className="text-xs text-destructive text-center mt-3">Incorrect code. Please try again.</p>
        )}
        {loading && (
          <p className="text-xs text-muted-foreground text-center mt-3">Creating your account…</p>
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
  }

  return (
    <AuthLayout backLabel="Back to chat" onBack={() => navigate("/")}>
      <div className="flex flex-col items-center mb-7">
        <div className="h-12 w-12 rounded-2xl overflow-hidden shadow-md mb-4">
          <img src="/logo.png" alt="Elite Veo" className="h-full w-full object-cover" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Create your account</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pendingPrompt ? "Sign up to create your video" : "Start creating videos with AI"}
        </p>
      </div>

      {pendingPrompt && (
        <div className="rounded-2xl border border-border/40 bg-secondary/20 px-4 py-3 mb-5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Your video idea</p>
          <p className="text-sm text-foreground line-clamp-2">{pendingPrompt}</p>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full name</label>
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
          disabled={loading}
          className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors mt-1"
        >
          {loading ? "Sending code…" : "Continue"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 border-t border-border/40" />
        <span className="text-[11px] text-muted-foreground">or</span>
        <div className="flex-1 border-t border-border/40" />
      </div>

      <p className="text-center text-sm text-muted-foreground">
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
