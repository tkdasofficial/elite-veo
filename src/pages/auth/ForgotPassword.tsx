import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, MailCheck } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import { useAuth } from "@/context/AuthContext";

const Logo = () => (
  <div className="flex flex-col items-center mb-7">
    <div className="h-12 w-12 rounded-2xl overflow-hidden shadow-md mb-4">
      <img src="/logo.png" alt="Elite Veo" className="h-full w-full object-cover" />
    </div>
  </div>
);

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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
    if (error) {
      setEmailError(error);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthLayout backLabel="Back to sign in" onBack={() => navigate("/login")}>
        <div className="flex flex-col items-center text-center gap-5">
          <Logo />
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 -mt-2">
            <MailCheck className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground mb-1">Check your inbox</p>
            <p className="text-sm text-muted-foreground">
              We sent a password reset link to <span className="font-semibold text-foreground">{email}</span>.
            </p>
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
  }

  return (
    <AuthLayout backLabel="Back to sign in" onBack={() => navigate("/login")}>
      <Logo />
      <div className="text-center -mt-3 mb-7">
        <h1 className="text-xl font-bold text-foreground">Forgot password?</h1>
        <p className="text-sm text-muted-foreground mt-1">Enter your email and we'll send you a reset link</p>
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
          {loading ? "Sending…" : "Send Reset Link"}
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
