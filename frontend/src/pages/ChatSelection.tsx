import { ChatPicker } from "../components/ChatPicker";

interface Props {
  onComplete: () => void;
}

export function ChatSelection({ onComplete }: Props) {
  return (
    <main className="chats-setup-page">
      <div className="chats-setup-panel">
        <h1>Чаты для отслеживания</h1>
        <p className="lead">
          Выберите чаты, из которых TaskExtraction будет получать сообщения в реальном времени.
        </p>
        <ChatPicker onSaved={onComplete} submitLabel="Начать отслеживание" />
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
