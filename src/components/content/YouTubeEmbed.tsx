import { useState } from "react";
import {
  YOUTUBE_EMBED_URL,
  YOUTUBE_THUMBNAIL_URL,
  YOUTUBE_VIDEO_ID,
  YOUTUBE_VIDEO_TITLE,
} from "@/content/seo";

type YouTubeEmbedProps = {
  videoId?: string;
  title?: string;
};

export function YouTubeEmbed({
  videoId = YOUTUBE_VIDEO_ID,
  title = YOUTUBE_VIDEO_TITLE,
}: YouTubeEmbedProps) {
  const [playing, setPlaying] = useState(false);
  const embedUrl =
    videoId === YOUTUBE_VIDEO_ID
      ? YOUTUBE_EMBED_URL
      : `https://www.youtube.com/embed/${videoId}`;
  const thumbnailUrl =
    videoId === YOUTUBE_VIDEO_ID
      ? YOUTUBE_THUMBNAIL_URL
      : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  if (playing) {
    const separator = embedUrl.includes("?") ? "&" : "?";
    return (
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`${embedUrl}${separator}autoplay=1`}
        title={title}
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
      aria-label={`Play video: ${title}`}
    >
      <img
        src={thumbnailUrl}
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
