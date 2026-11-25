import { SITE_URL } from "@/content/seo";

export const THREADS_META_TITLE =
  "Threads Unfollow Tracker — See Who Unfollowed You";

export const THREADS_META_DESCRIPTION =
  "Find out who unfollowed you on Threads using your official Meta export. Free, no login — comparison runs fully in your browser.";

export const THREADS_FEATURED_IMAGE_PATH = "/images/threads-unfollow-tracker-featured.webp";
export const THREADS_FEATURED_IMAGE_PATH_800 = "/images/threads-unfollow-tracker-featured-800.webp";
export const THREADS_FEATURED_IMAGE_URL = `${SITE_URL}${THREADS_FEATURED_IMAGE_PATH}`;
export const THREADS_FEATURED_IMAGE_ALT = THREADS_META_TITLE;
export const THREADS_FEATURED_IMAGE_WIDTH = 1280;
export const THREADS_FEATURED_IMAGE_HEIGHT = 850;
export const THREADS_FEATURED_IMAGE_WIDTH_800 = 800;
export const THREADS_FEATURED_IMAGE_HEIGHT_800 = 531;

export const THREADS_YOUTUBE_VIDEO_ID = "3F87NQ8hf-8";
export const THREADS_YOUTUBE_WATCH_URL = `https://www.youtube.com/watch?v=${THREADS_YOUTUBE_VIDEO_ID}`;
export const THREADS_YOUTUBE_EMBED_URL = `https://www.youtube.com/embed/${THREADS_YOUTUBE_VIDEO_ID}`;
export const THREADS_YOUTUBE_THUMBNAIL_URL = `https://i.ytimg.com/vi/${THREADS_YOUTUBE_VIDEO_ID}/hqdefault.jpg`;
export const THREADS_YOUTUBE_VIDEO_TITLE =
  "Threads Unfollow Tracker — See Who Unfollowed You | IGUnfollowed.com";

export const THREADS_FAQS = [
  {
    question: "Does this work for private Threads accounts?",
    answer:
      "Yes, the export is tied to your own account's data, not to whether your profile is public or private. A private Threads account gets the same follower and following data in its export as a public one.",
  },
  {
    question: "How long does the Threads data request take?",
    answer:
      "Usually a few minutes to a few hours for most accounts. Meta's help pages mention a maximum wait of up to 30 days, though that's rare in practice.",
  },
  {
    question: "Can I check someone else's Threads followers this way?",
    answer:
      "No, this method only works with your own export, since you need your own account password to request it. Seeing another account's followers this way would require their login, which no legitimate tool should ever ask you for.",
  },
  {
    question: "Is this the same as the Instagram Unfollow Tracker tool?",
    answer:
      "The underlying idea is the same, comparing one export against another, but the file structure isn't guaranteed to match. Instagram's export format is more consistently documented, while Threads exports have shown some inconsistency in file naming across different guides and tools, so a tool built for one usually needs small adjustments before it reads the other correctly.",
  },
] as const;

export function buildThreadsJsonLd(): Record<string, unknown> {
  const pageUrl = `${SITE_URL}/threads-unfollow-tracker`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: THREADS_META_TITLE,
        description: THREADS_META_DESCRIPTION,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        primaryImageOfPage: { "@id": `${pageUrl}#featured-image` },
        about: { "@id": `${pageUrl}#app` },
        video: { "@id": `${pageUrl}#video` },
        inLanguage: "en",
      },
      {
        "@type": "ImageObject",
        "@id": `${pageUrl}#featured-image`,
        url: THREADS_FEATURED_IMAGE_URL,
        contentUrl: THREADS_FEATURED_IMAGE_URL,
        width: THREADS_FEATURED_IMAGE_WIDTH,
        height: THREADS_FEATURED_IMAGE_HEIGHT,
        caption: THREADS_FEATURED_IMAGE_ALT,
        inLanguage: "en",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${pageUrl}#app`,
        name: THREADS_META_TITLE,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web Browser",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        description: THREADS_META_DESCRIPTION,
        url: pageUrl,
        image: THREADS_FEATURED_IMAGE_URL,
        featureList: [
          "No Threads login or password",
          "Local in-browser ZIP analysis",
          "Not following back and two-export unfollow compare",
          "Free to use",
        ],
      },
      {
        "@type": "VideoObject",
        "@id": `${pageUrl}#video`,
        name: THREADS_YOUTUBE_VIDEO_TITLE,
        description: THREADS_META_DESCRIPTION,
        thumbnailUrl: THREADS_YOUTUBE_THUMBNAIL_URL,
        embedUrl: THREADS_YOUTUBE_EMBED_URL,
        contentUrl: THREADS_YOUTUBE_WATCH_URL,
        uploadDate: "2026-11-01",
        publisher: {
          "@type": "Organization",
          name: "Unfollow Tracker",
          url: `${SITE_URL}/`,
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: THREADS_FAQS.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };
}
