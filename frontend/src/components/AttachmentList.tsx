import { useState } from "react";
import { ImageLightbox } from "./ImageLightbox";
import { mediaUrl } from "../utils/mediaUrl";

export interface Attachment {
  id: string;
  kind: string;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  url: string | null;
  download_url: string | null;
  is_image: boolean;
  is_video: boolean;
  is_audio: boolean;
  label: string;
}

function formatSize(bytes: number | null | undefined): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function kindIcon(kind: string): string {
  if (kind === "photo") return "🖼";
  if (kind === "video" || kind === "animation") return "🎬";
  if (kind === "voice" || kind === "audio") return "🎵";
  if (kind === "pdf") return "📄";
  if (kind === "spreadsheet") return "📊";
  if (kind === "document") return "📝";
  if (kind === "archive") return "📦";
  if (kind === "link") return "🔗";
  return "📎";
}

export function AttachmentList({
  attachments,
  compact = false,
}: {
  attachments: Attachment[];
  compact?: boolean;
}) {
  const [preview, setPreview] = useState<{ src: string; alt: string } | null>(null);

  if (!attachments.length) return null;

  const files = attachments.filter((a) => a.download_url);
  const links = attachments.filter((a) => a.kind === "link" && a.url);

  return (
    <>
      <div className={`att-list${compact ? " compact" : ""}`}>
        {files.map((a) => {
          const fileSrc = mediaUrl(a.download_url);
          return (
            <div key={a.id} className="att-item">
              {a.is_image && fileSrc ? (
                <button
                  type="button"
                  className="att-image-btn"
                  onClick={() => setPreview({ src: fileSrc, alt: a.label })}
                  aria-label={`Открыть ${a.label}`}
                >
                  <img src={fileSrc} alt={a.label} loading="lazy" />
                  <span className="att-zoom-hint">Нажмите для просмотра</span>
                </button>
              ) : a.is_video && fileSrc ? (
                <video controls preload="metadata" src={fileSrc} className="att-video" />
              ) : a.is_audio && fileSrc ? (
                <audio controls preload="metadata" src={fileSrc} className="att-audio" />
              ) : (
                <a
                  href={fileSrc}
                  target="_blank"
                  rel="noreferrer"
                  className="att-file"
                  download={a.file_name || undefined}
                >
                  <span className="att-icon">{kindIcon(a.kind)}</span>
                  <span className="att-meta">
                    <span className="att-name">{a.file_name || a.label}</span>
                    <span className="att-sub">
                      {a.kind}
                      {a.file_size != null ? ` · ${formatSize(a.file_size)}` : ""}
                    </span>
                  </span>
                </a>
              )}
            </div>
          );
        })}
        {links.map((a) => (
          <a key={a.id} href={a.url!} target="_blank" rel="noreferrer" className="att-link">
            <span className="att-icon">🔗</span>
            <span className="att-name">{a.url}</span>
          </a>
        ))}
        <style>{`
          .att-list { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; }
          .att-list.compact { gap: 0.35rem; margin-top: 0.35rem; }
          .att-item { border-radius: 8px; overflow: hidden; border: 1px solid var(--border); background: var(--bg); }
          .att-image-btn {
            display: block; width: 100%; padding: 0; border: none; background: none;
            cursor: zoom-in; position: relative;
          }
          .att-image-btn img {
            display: block; width: 100%;
            max-height: ${compact ? "160px" : "280px"};
            object-fit: contain;
          }
          .att-image-btn:hover img { opacity: 0.92; }
          .att-zoom-hint {
            position: absolute; bottom: 0; left: 0; right: 0;
            padding: 0.35rem 0.5rem;
            font-size: 0.68rem; color: #e2e8f0;
            background: linear-gradient(transparent, rgba(0,0,0,0.65));
            opacity: 0; transition: opacity 0.15s;
            pointer-events: none;
          }
          .att-image-btn:hover .att-zoom-hint { opacity: 1; }
          .att-video, .att-audio { display: block; width: 100%; max-height: ${compact ? "120px" : "200px"}; }
          .att-file, .att-link {
            display: flex; align-items: center; gap: 0.5rem;
            padding: 0.45rem 0.6rem; color: var(--text); text-decoration: none; font-size: 0.85rem;
          }
          .att-file:hover, .att-link:hover { background: rgba(96, 165, 250, 0.08); }
          .att-icon { font-size: 1.1rem; flex-shrink: 0; }
          .att-meta { min-width: 0; display: flex; flex-direction: column; }
          .att-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .att-sub { font-size: 0.72rem; color: var(--muted); }
          .att-link .att-name { word-break: break-all; white-space: normal; }
        `}</style>
      </div>

      {preview && (
        <ImageLightbox src={preview.src} alt={preview.alt} onClose={() => setPreview(null)} />
      )}
    </>
  );
}
