import { ChatPicker } from "../components/ChatPicker";

interface Props {
  onComplete: () => void;
}

export function ChatSelection({ onComplete }: Props) {
  return (
    <div className="center-page">
      <div className="panel">
        <h1>Чаты для отслеживания</h1>
        <p className="lead">
          Выберите чаты, из которых TaskExtraction будет получать сообщения в реальном времени.
        </p>
        <ChatPicker onSaved={onComplete} submitLabel="Начать отслеживание" />
      </div>
      <style>{`
        .center-page {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          padding: 1.5rem 1rem;
        }
        .panel { width: 100%; max-width: 560px; }
        .panel h1 { margin: 0 0 0.5rem; font-size: 1.35rem; }
        .lead { color: var(--muted); margin: 0 0 1.25rem; line-height: 1.45; }
      `}</style>
    </div>
  );
}
