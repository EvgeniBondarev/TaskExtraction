import { ChatPicker } from "../components/ChatPicker";
import { useI18n } from "../i18n";

interface Props {
  onComplete: () => void;
}

export function ChatSelection({ onComplete }: Props) {
  const { messages: t } = useI18n();

  return (
    <main className="chats-setup-page">
      <div className="chats-setup-panel">
        <h1>{t.app.chatsTitle}</h1>
        <p className="lead">{t.app.chatsLead}</p>
        <ChatPicker onSaved={onComplete} submitLabel={t.app.chatsSubmit} />
      </div>
      <style>{`
        .chats-setup-page { width: 100%; }
        .chats-setup-panel { width: 100%; }
        .chats-setup-panel h1 { margin: 0 0 0.5rem; font-size: 1.35rem; }
        .lead { color: var(--muted); margin: 0 0 1.25rem; line-height: 1.45; }
      `}</style>
    </main>
  );
}
