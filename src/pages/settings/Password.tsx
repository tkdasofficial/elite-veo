import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, ShieldCheck, Loader2 } from "lucide-react";
import { SettingsPage } from "@/components/settings/shared";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import OtpInput from "@/components/auth/OtpInput";
import { toast } from "sonner";

type Stage = "intro" | "otp" | "new";

const Password = () => {
  const navigate = useNavigate();
  const { user, resetPassword, verifyRecoveryOtp, updatePassword } = useAuth();
  const [stage, setStage]       = useState<Stage>("intro");
  const [loading, setLoading]   = useState(false);
  const [otpError, setOtpError] = useState("");
  const [pw, setPw]             = useState("");
  const [pw2, setPw2]           = useState("");

  const sendOtp = async () => {
    if (!user?.email) return toast.error("No email on this account");
    setLoading(true);
    const { error } = await resetPassword(user.email);
    setLoading(false);
    if (error) return toast.error(error);
    toast.success("Verification code sent to your email");
    setStage("otp");
  };

  const verifyOtp = async (token: string) => {
    if (!user?.email) return;
    setLoading(true);
    setOtpError("");
    const { error } = await verifyRecoveryOtp(user.email, token);
    setLoading(false);
    if (error) { setOtpError(error); return; }
    setStage("new");
  };

  const saveNewPassword = async () => {
    if (pw.length < 6) return toast.error("Password must be at least 6 characters");
    if (pw !== pw2)    return toast.error("Passwords do not match");
    setLoading(true);
    const { error } = await updatePassword(pw);
    setLoading(false);
    if (error) return toast.error(error);
    toast.success("Password updated successfully");
    navigate("/settings");
  };

  return (
    <SettingsPage title="Change Password" onBack={() => navigate("/settings")}>
      <div className="px-4 pt-6 pb-10 max-w-md mx-auto w-full">

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {(["intro", "otp", "new"] as Stage[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  stage === s
                    ? "bg-primary text-primary-foreground"
                    : i < (["intro","otp","new"].indexOf(stage))
                    ? "bg-primary/30 text-primary"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              {i < 2 && (
                <div className={`h-0.5 flex-1 rounded transition-colors ${
                  i < (["intro","otp","new"].indexOf(stage)) ? "bg-primary/40" : "bg-border/30"
                }`} />
              )}
            </div>
          ))}
        </div>

        {stage === "intro" && (
          <div className="rounded-2xl bg-secondary/30 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <KeyRound className="h-5 w-5 text-foreground/70" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Verify your identity</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We'll send a one-time code to your email to confirm it's really you before changing your password.
            </p>
            <Button onClick={sendOtp} disabled={loading} className="w-full rounded-xl h-11">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send verification code
            </Button>
          </div>
        )}

        {stage === "otp" && (
          <div className="rounded-2xl bg-secondary/30 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <ShieldCheck className="h-5 w-5 text-foreground/70" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Enter the code</p>
                <p className="text-xs text-muted-foreground">Sent to {user?.email}</p>
              </div>
            </div>
            <OtpInput length={8} onComplete={verifyOtp} disabled={loading} error={!!otpError} />
            {otpError && <p className="text-xs text-destructive text-center">{otpError}</p>}
            {loading && <p className="text-xs text-muted-foreground text-center">Verifying…</p>}
            <button
              onClick={sendOtp}
              disabled={loading}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Didn't receive it? Resend code
            </button>
          </div>
        )}

        {stage === "new" && (
          <div className="rounded-2xl bg-secondary/30 p-5 space-y-4">
            <p className="text-sm font-semibold text-foreground">Set your new password</p>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">New password</Label>
              <Input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Minimum 6 characters"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Confirm password</Label>
              <Input
                type="password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                placeholder="Repeat new password"
                className="rounded-xl"
                onKeyDown={(e) => e.key === "Enter" && saveNewPassword()}
              />
            </div>
            {pw && pw2 && pw !== pw2 && (
              <p className="text-xs text-destructive">Passwords don't match</p>
            )}
            <Button onClick={saveNewPassword} disabled={loading} className="w-full rounded-xl h-11">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update password
            </Button>
          </div>
        )}
      </div>
    </SettingsPage>
  );
};

export default Password;
