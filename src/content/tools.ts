export type ToolStatus = "live" | "coming-soon";

/** Lucide icon names used by related-tool cards. Add names here when a new tool needs a new icon. */
export type ToolIconName = "shield" | "users" | "file-text" | "sparkles";

export interface ToolEntry {
  slug: string;
  name: string;
  shortDescription: string;
  href: string;
  status: ToolStatus;
  icon: ToolIconName;
}

export const tools: ToolEntry[] = [
  {
    slug: "unfollow-tracker",
    name: "Unfollow Tracker",
    shortDescription:
      "See who doesn’t follow you back from your official Instagram export — 100% in your browser.",
    href: "/",
    status: "live",
    icon: "shield",
  },
  // PLACEHOLDER — do not uncomment until the tool is ready.
  // {
  //   slug: "example-tool-two",
  //   name: "Example Tool Two",
  //   shortDescription: "Short description for the second tool.",
  //   href: "/example-two",
  //   status: "coming-soon",
  //   icon: "users",
  // },
  // PLACEHOLDER — do not uncomment until the tool is ready.
  // {
  //   slug: "example-tool-three",
  //   name: "Example Tool Three",
  //   shortDescription: "Short description for the third tool.",
  //   href: "/example-three",
  //   status: "coming-soon",
  //   icon: "file-text",
  // },
  // PLACEHOLDER — do not uncomment until the tool is ready.
  // {
  //   slug: "example-tool-four",
  //   name: "Example Tool Four",
  //   shortDescription: "Short description for the fourth tool.",
  //   href: "/example-four",
  //   status: "coming-soon",
  //   icon: "sparkles",
  // },
];

export function getTool(slug: string): ToolEntry | undefined {
  return tools.find((tool) => tool.slug === slug);
}

export function liveRelatedTools(currentSlug: string): ToolEntry[] {
  return tools.filter((tool) => tool.status === "live" && tool.slug !== currentSlug);
}

export { liveRelatedTools as relatedLiveTools };
