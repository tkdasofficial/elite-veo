import { ArrowLeft } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  backLabel?: string;
  onBack?: () => void;
}

const AuthLayout = ({ children, backLabel, onBack }: AuthLayoutProps) => {
  return (
    <div className="relative h-dvh w-full overflow-y-auto bg-background">

      {/* Back button — sticky so it stays visible while scrolling */}
      {onBack && (
        <button
          onClick={onBack}
          className="sticky top-0 z-10 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors bg-background/80 backdrop-blur-sm px-3 py-3 ml-1"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          <span>{backLabel ?? "Back"}</span>
        </button>
      )}

      {/* Centered body — min-height ensures vertical centering on tall screens
          but content can scroll naturally on short ones */}
      <div className="min-h-full flex items-center justify-center px-5 pb-10 pt-4">
        <div className="w-full max-w-[360px] py-4">
          {children}
        </div>
      </div>

    </div>
  );
};

export default AuthLayout;
