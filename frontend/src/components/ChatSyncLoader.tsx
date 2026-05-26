import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { TelegramLogo } from "./TelegramLogo";
import "../styles/chat-picker.css";

const FAKE_CHAT_NAMES = [
  "Support Team",
  "Product Updates",
  "Dev Chat",
  "Клиенты VIP",
  "Общий чат",
  "HR Announcements",
];

interface Props {
  mode?: "initial" | "sync";
}

export function ChatSyncLoader({ mode = "initial" }: Props) {
  const { messages: t } = useI18n();
  const steps = t.app.chatLoadSteps;
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  const title = mode === "sync" ? t.app.chatLoadTitleSync : t.app.chatLoadTitle;
  const marqueeItems = [...FAKE_CHAT_NAMES, ...FAKE_CHAT_NAMES];

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStepIdx((i) => (i + 1) % steps.length);
    }, 2800);
    return () => clearInterval(stepTimer);
  }, [steps.length]);

  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(92, (elapsed / 55000) * 92);
      setProgress(pct);
    }, 200);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="chat-sync-loader" role="status" aria-live="polite" aria-busy="true">
      <div className="chat-sync-loader__hero">
        <div className="chat-sync-loader__logo-wrap">
          <TelegramLogo size={40} />
          <span className="chat-sync-loader__pulse" aria-hidden />
        </div>
        <h3 className="chat-sync-loader__title">{title}</h3>
        <p className="chat-sync-loader__hint">{t.app.chatLoadHint}</p>
      </div>

      <div className="chat-sync-loader__progress-wrap">
        <div className="chat-sync-loader__progress-track">
          <div
            className="chat-sync-loader__progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="chat-sync-loader__step" key={stepIdx}>
          {steps[stepIdx]}
        </p>
      </div>

      <div className="chat-sync-loader__previews-viewport" aria-hidden>
        <ul className="chat-sync-loader__previews-track">
          {marqueeItems.map((name, i) => (
            <li key={`${name}-${i}`} className="chat-sync-loader__preview-row">
              <span className="chat-sync-loader__preview-avatar" />
              <span className="chat-sync-loader__preview-lines">
                <span className="chat-sync-loader__preview-title">{name}</span>
                <span className="chat-sync-loader__preview-sub">{t.app.chatLoadPreviewSub}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="chat-sync-loader__footnote">{t.app.chatLoadFootnote}</p>
    </div>
  );
}
