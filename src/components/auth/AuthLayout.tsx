import { ArrowLeft } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  backLabel?: string;
  onBack?: () => void;
}

const AuthLayout = ({ children, backLabel, onBack }: AuthLayoutProps) => {
  return (
    <div className="relative min-h-dvh flex flex-col bg-background">

      {/* Back button — absolutely pinned to top-left corner */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors px-1 py-1"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          <span>{backLabel ?? "Back"}</span>
        </button>
      )}

      {/* Scrollable centered body — top padding clears the back button */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center px-5 py-8 pt-14">
        <div className="w-full max-w-[360px]">
          {children}
        </div>
      </div>

    </div>
  );
};

export default AuthLayout;
