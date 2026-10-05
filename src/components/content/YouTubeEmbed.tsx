import { useState } from "react";
import { YOUTUBE_EMBED_URL, YOUTUBE_THUMBNAIL_URL, YOUTUBE_VIDEO_TITLE } from "@/content/seo";

export function YouTubeEmbed() {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    const separator = YOUTUBE_EMBED_URL.includes("?") ? "&" : "?";
    return (
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`${YOUTUBE_EMBED_URL}${separator}autoplay=1`}
        title={YOUTUBE_VIDEO_TITLE}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      className="absolute inset-0 flex items-center justify-center bg-card"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${YOUTUBE_VIDEO_TITLE}`}
    >
      <img
        src={YOUTUBE_THUMBNAIL_URL}
        alt=""
        width={480}
        height={360}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <span
        className="pointer-events-none absolute flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-current" aria-hidden>
          <path d="M8 5.14v13.72L19 12 8 5.14z" />
        </svg>
      </span>
    </button>
  );
}
