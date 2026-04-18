import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/context/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const pendingPrompt = sessionStorage.getItem("pending_prompt");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(
        /invalid/i.test(error)
          ? "Invalid email or password."
          : error
      );
      return;
    }
    navigate("/");
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

  return (
    <AuthLayout backLabel="Back to chat" onBack={() => navigate("/")}>
      <div className="flex flex-col items-center mb-8">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Elite Veo</p>
        <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pendingPrompt ? "Sign in to continue" : "Sign in to your account"}
        </p>
      </div>

      {pendingPrompt && (
        <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3 mb-5">
          <p className="text-xs text-muted-foreground mb-1">Your pending request</p>
          <p className="text-sm text-foreground line-clamp-2">{pendingPrompt}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading || loading}
        className="w-full h-11 rounded-xl border border-border bg-secondary/30 flex items-center justify-center gap-3 text-sm font-medium text-foreground hover:bg-secondary/60 disabled:opacity-50 transition-colors mb-5"
      >
        <FcGoogle className="h-5 w-5" />
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 border-t border-border/40" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="flex-1 border-t border-border/40" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Email</label>
          <input
            type="email"
            data-testid="input-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-muted-foreground">Password</label>
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              data-testid="input-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full rounded-xl border border-border bg-secondary/30 px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
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

        {error && (
          <p data-testid="text-error" className="text-xs text-destructive">{error}</p>
        )}

        <button
          type="submit"
          data-testid="button-login"
          disabled={loading || googleLoading}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity mt-1"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don't have an account?{" "}
        <Link to="/signup" data-testid="link-signup" className="font-medium text-foreground hover:underline">
          Get Started
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
