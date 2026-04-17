import { useRef, useState, useEffect, ClipboardEvent, KeyboardEvent } from "react";

interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  onChange?: (otp: string) => void;
  disabled?: boolean;
  error?: boolean;
}

const OtpInput = ({ length = 8, onComplete, onChange, disabled, error }: OtpInputProps) => {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const updateValues = (next: string[]) => {
    setValues(next);
    const joined = next.join("");
    onChange?.(joined);
    if (joined.length === length) onComplete(joined);
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    const next = [...values];
    next[index] = digit;
    updateValues(next);
    if (index < length - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (values[index]) {
        const next = [...values];
        next[index] = "";
        updateValues(next);
      } else if (index > 0) {
        const next = [...values];
        next[index - 1] = "";
        updateValues(next);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    const next = Array(length).fill("");
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    updateValues(next);
    const focusIdx = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleFocus = (index: number) => {
    inputRefs.current[index]?.select();
  };

  return (
    <div className="flex gap-1 sm:gap-1.5 justify-center w-full">
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(i)}
          className={[
            "flex-1 min-w-0 max-w-[42px] h-11 sm:h-12 rounded-xl border text-center text-base font-semibold text-foreground bg-secondary/30 transition-all focus:outline-none",
            error
              ? "border-destructive focus:border-destructive bg-destructive/5"
              : val
              ? "border-primary/70 bg-primary/8"
              : "border-border focus:border-primary/60",
            disabled ? "opacity-50 cursor-not-allowed" : "",
          ].join(" ")}
        />
      ))}
    </div>
  );
};

export default OtpInput;
