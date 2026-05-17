import { mediaUrl } from "../utils/mediaUrl";

interface Props {
  senderUrl?: string | null;
  chatUrl?: string | null;
  name?: string | null;
  size?: number;
}

export function MessageAvatar({ senderUrl, chatUrl, name, size = 44 }: Props) {
  const src = mediaUrl(senderUrl) || mediaUrl(chatUrl);
  const initials = (name || "?")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="msg-avatar" style={{ width: size, height: size }}>
      {src ? (
        <img src={src} alt="" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
      ) : (
        <span className="placeholder">{initials}</span>
      )}
      {mediaUrl(chatUrl) && mediaUrl(senderUrl) && (
        <img className="chat-badge" src={mediaUrl(chatUrl)} alt="" />
      )}
      <style>{`
        .msg-avatar {
          position: relative; flex-shrink: 0; display: inline-block;
        }
        .msg-avatar img:not(.chat-badge) {
          width: 100%; height: 100%; border-radius: 50%; object-fit: cover;
          background: var(--border);
        }
        .msg-avatar .placeholder {
          width: 100%; height: 100%; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: var(--border); color: var(--muted);
          font-size: 0.75rem; font-weight: 600;
        }
        .msg-avatar .chat-badge {
          position: absolute; right: -2px; bottom: -2px;
          width: 38%; height: 38%; border-radius: 50%;
          border: 2px solid var(--surface); object-fit: cover;
        }
      `}</style>
    </span>
  );
}
