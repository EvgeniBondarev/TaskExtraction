import { ChatPicker } from "../components/ChatPicker";
import { useI18n } from "../i18n";
import "../styles/chat-picker.css";

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
    </main>
  );
}
