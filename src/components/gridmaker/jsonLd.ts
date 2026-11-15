import { SITE_URL } from "@/content/seo";
import { loadArticle, splitArticleFaq } from "@/lib/content";

export function gridMakerJsonLd(): Record<string, unknown> {
  const source = loadArticle("instagram-grid-maker") ?? "";
  const { faqItems } = splitArticleFaq(source);
  const pageUrl = `${SITE_URL}/instagram-grid-maker`;
  const imageUrl = `${SITE_URL}/images/instagram-grid-maker-featured.jpg`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Unfollow Tracker",
            item: `${SITE_URL}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Instagram Grid Maker",
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${pageUrl}#app`,
        name: "Instagram Grid Maker",
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web Browser",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        url: pageUrl,
        image: imageUrl,
        description:
          "Split one photo into an Instagram profile grid or carousel in your browser. No login, no watermark, no upload.",
        featureList: [
          "No Instagram login or password",
          "Client-side canvas splitting",
          "3:4 profile thumbnail preview",
          "Profile grid and carousel modes",
          "Free, no watermark",
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };
}
