import { motion } from "motion/react";
import { useEffect, useRef } from "react";

interface Props {
  title: string;
  text: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Подтверждение необратимого действия. Esc и клик по фону отменяют, фокус сразу на «Отмена». */
export function ConfirmDialog({ title, text, confirmLabel, cancelLabel, danger, busy, onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="te-dialog-layer" role="alertdialog" aria-modal="true" aria-labelledby="te-confirm-title">
      <motion.div className="te-dialog-backdrop" onClick={onCancel} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      <motion.div
        className="te-dialog te-dialog--sm"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
      >
        <h2 id="te-confirm-title">{title}</h2>
        <p className="te-dialog__lead">{text}</p>
        <div className="te-dialog__actions">
          <button ref={cancelRef} type="button" className="te-btn te-btn--ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`te-btn ${danger ? "te-btn--danger" : "te-btn--primary"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
