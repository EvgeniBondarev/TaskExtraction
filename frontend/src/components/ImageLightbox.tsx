import { useEffect } from "react";
import { createPortal } from "react-dom";

interface Props {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, onClose }: Props) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр изображения"
      onClick={onClose}
    >
      <button type="button" className="lightbox-close" onClick={onClose} aria-label="Закрыть">
        ×
      </button>
      <img src={src} alt={alt || ""} onClick={(e) => e.stopPropagation()} />
      <style>{`
        .image-lightbox {
          position: fixed;
          inset: 0;
          z-index: 2147483000;
          background: rgba(5, 10, 18, 0.94);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          cursor: zoom-out;
          animation: lb-in 0.18s ease-out;
          isolation: isolate;
        }
        @keyframes lb-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .image-lightbox img {
          position: relative;
          z-index: 2147483001;
          max-width: min(96vw, 1400px);
          max-height: 92vh;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);
          cursor: default;
        }
        .image-lightbox .lightbox-close {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 2147483002;
          width: 2.75rem;
          height: 2.75rem;
          border: none;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.14);
          color: #fff;
          font-size: 1.6rem;
          line-height: 1;
          cursor: pointer;
        }
        .image-lightbox .lightbox-close:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      `}</style>
    </div>,
    document.body
  );
}
