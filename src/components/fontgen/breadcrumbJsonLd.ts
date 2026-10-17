import { SITE_URL } from "@/content/seo";

export function fontBreadcrumbJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
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
        name: "Instagram Font Generator",
        item: `${SITE_URL}/instagram-font-generator`,
      },
    ],
  };
}
