import { ArrowLeft } from "lucide-react";

/* ── localStorage helpers ── */
export const ls = {
  get: <T,>(key: string, fallback: T): T => {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? (JSON.parse(v) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set: <T,>(key: string, val: T) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },
};

/* ── Sub-page wrapper ── */
export const SettingsPage = ({
  title,
  onBack,
  trailing,
  children,
}: {
  title: string;
  onBack: () => void;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="h-dvh bg-background flex flex-col">
    <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-border/20">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-foreground truncate">{title}</span>
      </div>
      {trailing && <div className="shrink-0 pl-3">{trailing}</div>}
    </div>
    <div className="flex-1 overflow-y-auto">{children}</div>
  </div>
);

/* ── iOS-style toggle ── */
export const Toggle = ({
  on,
  onToggle,
  disabled,
}: {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    onClick={onToggle}
    disabled={disabled}
    className={[
      "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full",
      "transition-colors duration-200 ease-in-out focus-visible:outline-none",
      "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      "focus-visible:ring-offset-background disabled:opacity-40 disabled:cursor-not-allowed",
      on ? "bg-primary" : "bg-foreground/20",
    ].join(" ")}
  >
    <span
      className={[
        "pointer-events-none inline-block h-[22px] w-[22px] rounded-full bg-white",
        "shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-200 ease-in-out",
        on ? "translate-x-[22px]" : "translate-x-[3px]",
      ].join(" ")}
    />
  </button>
);

/* ── Settings row ── */
export const SettingsRow = ({
  icon: Icon,
  label,
  sublabel,
  onClick,
  danger,
  noArrow,
  trailing,
  iconBg,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  danger?: boolean;
  noArrow?: boolean;
  trailing?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={[
      "flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors",
      "disabled:cursor-default active:bg-secondary/60",
      danger ? "hover:bg-destructive/5" : "hover:bg-secondary/40",
    ].join(" ")}
  >
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
        iconBg ?? (danger ? "bg-destructive/10" : "bg-secondary")
      }`}
    >
      <Icon
        className={`h-4 w-4 ${
          iconColor ?? (danger ? "text-destructive" : "text-foreground/70")
        }`}
      />
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium ${danger ? "text-destructive" : "text-foreground"}`}>
        {label}
      </p>
      {sublabel && (
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{sublabel}</p>
      )}
    </div>
    {trailing}
    {!noArrow && !danger && onClick && !trailing && (
      <ArrowLeft className="h-4 w-4 text-muted-foreground/25 rotate-180 shrink-0" />
    )}
  </button>
);

/* ── Section card ── */
export const SectionCard = ({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) => (
  <div className="px-4 mb-3">
    {label && (
      <p className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2 px-1">
        {label}
      </p>
    )}
    <div className="rounded-2xl bg-secondary/30 overflow-hidden divide-y divide-border/20">
      {children}
    </div>
  </div>
);
