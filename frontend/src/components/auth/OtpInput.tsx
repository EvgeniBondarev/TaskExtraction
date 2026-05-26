import { useCallback, useId, useRef } from "react";

interface Props {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  label?: string;
}

export function OtpInput({
  length = 5,
  value,
  onChange,
  onComplete,
  disabled,
  label = "Код подтверждения",
}: Props) {
  const labelId = useId();
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.replace(/\D/g, "").slice(0, length).split("");
  while (digits.length < length) digits.push("");

  const commit = useCallback(
    (next: string) => {
      const clean = next.replace(/\D/g, "").slice(0, length);
      onChange(clean);
      if (clean.length === length) {
        onComplete?.(clean);
      }
    },
    [length, onChange, onComplete]
  );

  const focusAt = (index: number) => {
    const el = refs.current[Math.max(0, Math.min(index, length - 1))];
    el?.focus();
    el?.select();
  };

  const setDigit = (index: number, char: string) => {
    const arr = digits.slice();
    arr[index] = char;
    commit(arr.join(""));
    if (char && index < length - 1) focusAt(index + 1);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        setDigit(index, "");
      } else if (index > 0) {
        setDigit(index - 1, "");
        focusAt(index - 1);
      }
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusAt(index - 1);
      return;
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    commit(pasted);
    focusAt(Math.min(pasted.length, length - 1));
  };

  return (
    <div className="te-otp-field">
      <span id={labelId} className="te-otp-field__label">
        {label}
      </span>
      <div
        className="te-otp-field__cells"
        role="group"
        aria-labelledby={labelId}
        onPaste={handlePaste}
      >
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            className={`te-otp-field__cell${d ? " te-otp-field__cell--filled" : ""}`}
            value={d}
            disabled={disabled}
            aria-label={`Цифра ${i + 1} из ${length}`}
            onChange={(e) => {
              const ch = e.target.value.replace(/\D/g, "").slice(-1);
              setDigit(i, ch);
            }}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
          />
        ))}
      </div>
    </div>
  );
}
