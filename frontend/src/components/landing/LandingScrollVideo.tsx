import { useEffect, useRef, useState } from "react";
import { useI18n } from "../../i18n";
import { ScrollReveal } from "./ScrollReveal";

const VIDEO_SRC = "/videos/welcome-demo.mp4";

export function LandingScrollVideo() {
  const { messages: t } = useI18n();
  const lp = t.landing;
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const video = videoRef.current;
    if (!wrap || !video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
          if (!reducedMotion) {
            video.play().catch(() => {
              /* autoplay может быть заблокирован до взаимодействия */
            });
          }
        } else {
          video.pause();
        }
      },
      { threshold: [0, 0.45, 0.65] },
    );

    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="lp-section lp-demo" id="demo" aria-label={lp.demoAria}>
      <ScrollReveal className="lp-section-head lp-section-head--center">
        <span className="lp-badge">{lp.demoBadge}</span>
        <h2>{lp.demoTitle}</h2>
        <p className="lp-section-lead">{lp.demoLead}</p>
      </ScrollReveal>

      <ScrollReveal delay={60} direction="scale">
        <div
          ref={wrapRef}
          className={`lp-demo-player${ready ? " lp-demo-player--ready" : ""}`}
        >
          <video
            ref={videoRef}
            className="lp-demo-video"
            src={VIDEO_SRC}
            muted
            loop
            playsInline
            preload="metadata"
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            aria-label={lp.demoVideoAria}
            onLoadedData={() => setReady(true)}
            onContextMenu={(e) => e.preventDefault()}
          />
          <div className="lp-demo-player-glow" aria-hidden />
        </div>
      </ScrollReveal>
    </section>
  );
}
