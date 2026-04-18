import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, ShieldCheck, LogOut, Loader2 } from "lucide-react";
import { SettingsPage } from "@/components/settings/shared";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Security = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const signOutAll = async () => {
    setSigningOut(true);
    await supabase.auth.signOut({ scope: "global" });
    await signOut();
    navigate("/");
    toast.success("Signed out from all devices");
  };

  return (
    <SettingsPage title="Security" onBack={() => navigate("/settings")}>
      <div className="px-4 pt-5 pb-10 space-y-5 max-w-md mx-auto w-full">

        {/* Active session */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2 px-1">
            Active Session
          </p>
          <div className="rounded-2xl bg-secondary/30 overflow-hidden">
            <div className="flex items-center gap-4 px-4 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <Smartphone className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">This device</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-xs text-green-500 font-medium">Active now</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two-factor auth */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2 px-1">
            Two-Factor Authentication
          </p>
          <div className="rounded-2xl bg-secondary/30 overflow-hidden divide-y divide-border/20">
            <div className="flex items-center gap-4 px-4 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <ShieldCheck className="h-5 w-5 text-foreground/60" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Authenticator App</p>
                <p className="text-xs text-muted-foreground mt-0.5">TOTP two-factor authentication</p>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full uppercase tracking-wide">
                Soon
              </span>
            </div>
          </div>
        </div>

        {/* Password */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2 px-1">
            Login Credentials
          </p>
          <div className="rounded-2xl bg-secondary/30 overflow-hidden">
            <button
              onClick={() => navigate("/settings/password")}
              className="flex w-full items-center gap-4 px-4 py-4 hover:bg-secondary/40 active:bg-secondary/60 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <ShieldCheck className="h-5 w-5 text-foreground/60" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-foreground">Change Password</p>
                <p className="text-xs text-muted-foreground mt-0.5">Update your login password</p>
              </div>
              <LogOut className="h-4 w-4 text-muted-foreground/30 rotate-180" />
            </button>
          </div>
        </div>

        {/* Sign out all */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2 px-1">
            Devices
          </p>
          <div className="rounded-2xl bg-secondary/30 overflow-hidden">
            <button
              onClick={signOutAll}
              disabled={signingOut}
              className="flex w-full items-center gap-4 px-4 py-4 hover:bg-destructive/5 active:bg-destructive/10 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <LogOut className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-destructive">Sign out all devices</p>
                <p className="text-xs text-muted-foreground mt-0.5">End all active sessions everywhere</p>
              </div>
              {signingOut && <Loader2 className="h-4 w-4 text-destructive animate-spin" />}
            </button>
          </div>
        </div>
      </div>
    </SettingsPage>
  );
};

export default Security;
