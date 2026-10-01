export const SITE_URL = "https://unfollow-tracker.pages.dev";

export const HOME_META_TITLE = "Instagram Unfollow Tracker Free online - Without Login 2026";

export const HOME_META_DESCRIPTION =
  "Instagram Unfollow Tracker Free online - Without Login 2026. Upload your official ZIP and see who doesn't follow you back. Private in-browser analysis, no Instagram password required.";

export const FEATURED_IMAGE_PATH = "/images/instagram-unfollow-tracker-featured.jpg";
export const FEATURED_IMAGE_URL = `${SITE_URL}${FEATURED_IMAGE_PATH}`;
export const FEATURED_IMAGE_ALT = "Instagram Unfollow Tracker Free online - Without Login 2026";
export const FEATURED_IMAGE_WIDTH = 1280;
export const FEATURED_IMAGE_HEIGHT = 850;

export const YOUTUBE_VIDEO_ID = "X_kvk9f7_sA";
export const YOUTUBE_WATCH_URL = `https://www.youtube.com/watch?v=${YOUTUBE_VIDEO_ID}`;
export const YOUTUBE_EMBED_URL = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?si=yrjNuHBdYUMGtjQZ`;
export const YOUTUBE_VIDEO_TITLE = "See Who Doesn't Follow You Back on Instagram | IGUnfollowed.com";
export const YOUTUBE_THUMBNAIL_URL = `https://i.ytimg.com/vi/${YOUTUBE_VIDEO_ID}/hqdefault.jpg`;

export const howItWorksSteps = [
  {
    step: "1",
    title: "Request Zip File",
    body: "Go to Your Instagram Account Settings, Click on Meta Account, then click on Personal details, after that click on Your Information & Permissions, & then Request the Export Your Information in the form of a Zip file.",
  },
  {
    step: "2",
    title: "Download Zip File",
    body: "When the file is ready to download, you'll get notification from instagram & then download your zip file.",
  },
  {
    step: "3",
    title: "Upload Zip File",
    body: "Upload the downloaded file in the top box & you'll get the results.",
  },
] as const;

export const homeFaqs = [
  {
    question: "How can we see who unfollowed you on instagram?",
    answer:
      "It is very easy to detect who stopped following me on instagram, use our Unfollow Tracker tool by uploading your zip file.",
  },
  {
    question: "Is igunfollowed safe to use?",
    answer:
      "Yes, it's completely safe to use, because you don't need to login or provide your instagram password.",
  },
  {
    question: "Can I check non followers of multiple accounts?",
    answer: "Yes, by exporting multiple zip files you can analyze their data separately.",
  },
  {
    question: "Difference between unfollowers and users who don't follow you back",
    answer:
      '"Not following back" means you follow an account that isn\'t on your followers list and may never have followed you, while an unfollower is someone who was on your older list but is missing from your newer one.',
  },
  {
    question: "Can I see who blocked me on Instagram?",
    answer:
      "No there is not any app or software to see this, when someone blocked you on instagram, you cannot see their profile from any other sources.",
  },
] as const;

export function buildHomeJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "Unfollow Tracker",
        url: `${SITE_URL}/`,
        description: HOME_META_DESCRIPTION,
        inLanguage: "en",
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: `${SITE_URL}/`,
        name: HOME_META_TITLE,
        description: HOME_META_DESCRIPTION,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        primaryImageOfPage: { "@id": `${SITE_URL}/#featured-image` },
        about: { "@id": `${SITE_URL}/#app` },
        video: { "@id": `${SITE_URL}/#video` },
        inLanguage: "en",
      },
      {
        "@type": "ImageObject",
        "@id": `${SITE_URL}/#featured-image`,
        url: FEATURED_IMAGE_URL,
        contentUrl: FEATURED_IMAGE_URL,
        width: FEATURED_IMAGE_WIDTH,
        height: FEATURED_IMAGE_HEIGHT,
        caption: FEATURED_IMAGE_ALT,
        inLanguage: "en",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#app`,
        name: HOME_META_TITLE,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web Browser",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description: HOME_META_DESCRIPTION,
        url: `${SITE_URL}/`,
        image: FEATURED_IMAGE_URL,
        featureList: [
          "No Instagram login or password",
          "Local in-browser ZIP analysis",
          "See who doesn't follow you back",
          "Free to use",
        ],
      },
      {
        "@type": "HowTo",
        "@id": `${SITE_URL}/#howto`,
        name: "How Does Igunfollow Tool Works?",
        description:
          "Our Unfollow Tracker tool analysis data given by you & give you 100% accurate results. There is no risk, completely free, just upload your zip file in the top box & you'll get the results of who didn't follow you back.",
        image: FEATURED_IMAGE_URL,
        step: howItWorksSteps.map((item) => ({
          "@type": "HowToStep",
          position: Number(item.step),
          name: item.title,
          text: item.body,
        })),
      },
      {
        "@type": "VideoObject",
        "@id": `${SITE_URL}/#video`,
        name: YOUTUBE_VIDEO_TITLE,
        description: HOME_META_DESCRIPTION,
        thumbnailUrl: YOUTUBE_THUMBNAIL_URL,
        embedUrl: `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}`,
        contentUrl: YOUTUBE_WATCH_URL,
        uploadDate: "2026-10-01",
        publisher: {
          "@type": "Organization",
          name: "Unfollow Tracker",
          url: `${SITE_URL}/`,
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: homeFaqs.map((item) => ({
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
