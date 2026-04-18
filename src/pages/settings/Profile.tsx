import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { SettingsPage } from "@/components/settings/shared";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(
    () => (user as any)?.username ?? ""
  );
  const [saving, setSaving] = useState(false);

  const initials = (name || user?.name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const save = async () => {
    if (!name.trim()) return toast.error("Name is required");
    if (username && !/^[a-z0-9_]{3,20}$/.test(username)) {
      return toast.error("Username: 3-20 chars, lowercase letters, numbers, underscores only");
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: name.trim(),
        full_name: name.trim(),
        username: username.trim().toLowerCase(),
      },
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    navigate("/settings");
  };

  return (
    <SettingsPage title="Edit Profile" onBack={() => navigate("/settings")}>
      <div className="px-4 pt-6 pb-10 space-y-5 max-w-md mx-auto w-full">
        {/* Avatar preview — no upload */}
        <div className="flex flex-col items-center py-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold shadow-md shadow-primary/20 select-none">
            {initials}
          </div>
          <p className="mt-3 text-xs text-muted-foreground/60">
            Profile photo upload coming soon
          </p>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Display name
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="rounded-xl"
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
        </div>

        {/* Username */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Username
          </Label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
              @
            </span>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="yourhandle"
              className="rounded-xl pl-7"
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
          </div>
          <p className="text-[11px] text-muted-foreground/60 px-1">
            3–20 characters · lowercase letters, numbers, underscores
          </p>
        </div>

        {/* Email (read-only) */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Email
          </Label>
          <Input
            value={user?.email ?? ""}
            disabled
            className="rounded-xl opacity-50"
          />
          <p className="text-[11px] text-muted-foreground/60 px-1">
            Email cannot be changed here.
          </p>
        </div>

        <Button
          onClick={save}
          disabled={saving}
          className="w-full rounded-xl h-11"
        >
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save changes
        </Button>
      </div>
    </SettingsPage>
  );
};

export default Profile;
