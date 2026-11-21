import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const dist = join(process.cwd(), "dist");
const template = readFileSync(join(dist, "index.html"), "utf8");

const SITE = "https://igunfollowed.com";

/** Unique title/description/canonical for the HTML Google fetches before JavaScript. */
const ROUTES = [
  {
    path: "/",
    title: "Instagram Unfollow Tracker Free online - Without Login 2026",
    description:
      "Instagram Unfollow Tracker Free online - Without Login 2026. Upload your official ZIP and see who doesn't follow you back. Private in-browser analysis, no Instagram password required.",
    h1: "Instagram Unfollow Tracker",
    summary:
      "IGUnfollowed compares followers and following from your official Instagram export in this browser.",
    image: `${SITE}/images/instagram-unfollow-tracker-featured.jpg`,
    imageAlt: "Instagram Unfollow Tracker Free online - Without Login 2026",
    imageWidth: "1280",
    imageHeight: "850",
  },
  {
    path: "/analyze",
    title: "Analyze Instagram Export — Unfollow Tracker",
    description:
      "Upload an Instagram ZIP or JSON export to list accounts that do not follow you back. Compare two exports to see who left. Processing stays in your browser.",
    h1: "Analyze your export",
    summary:
      "One export shows who does not follow you back. Comparing two exports is required to see who unfollowed since last time.",
  },
  {
    path: "/guide",
    title: "How to download your Instagram export — Unfollow Tracker",
    description:
      "Step-by-step: request Instagram information, choose Followers and following, pick JSON, download the ZIP, and upload it to Analyze.",
    h1: "How to download your Instagram export",
    summary: "Request an official Meta export with Followers and following, then upload the ZIP on Analyze.",
  },
  {
    path: "/pending-requests",
    title: "Instagram Pending Follow Requests Checker",
    description:
      "See which Instagram follow requests you sent are still waiting — even from years ago. Upload your official export ZIP. Private, in-browser analysis, no login.",
    h1: "Instagram Pending Follow Requests Checker",
    summary: "Reads pending outgoing follow requests from your official Instagram ZIP in this browser.",
  },
  {
    path: "/privacy",
    title: "Privacy Policy — Unfollow Tracker",
    description:
      "How IGUnfollowed handles data: local ZIP analysis, optional IndexedDB snapshots, Highlights API lookups, and YouTube embeds.",
    h1: "Privacy Policy",
    summary: "ZIP analysis stays in the browser. Highlights lookups go through our API. Optional snapshots stay on this device.",
  },
  {
    path: "/terms",
    title: "Terms of Use — Unfollow Tracker",
    description: "Terms for using Unfollow Tracker’s browser-based Instagram export analysis tools.",
    h1: "Terms of Use",
    summary: "Rules for using IGUnfollowed export tools. Results depend on your official Instagram file.",
  },
  {
    path: "/about",
    title: "About — Unfollow Tracker",
    description:
      "Why Unfollow Tracker exists: private, password-free Instagram unfollow checks from your official export.",
    h1: "About Unfollow Tracker",
    summary: "Independent tools that read official Instagram exports in your browser without an Instagram password.",
  },
  {
    path: "/disclaimer",
    title: "Disclaimer — Unfollow Tracker",
    description:
      "Independent tool disclaimer: not affiliated with Instagram or Meta; results depend on your export.",
    h1: "Disclaimer",
    summary: "IGUnfollowed is not affiliated with Meta or Instagram. Results come from the file you provide.",
  },
  {
    path: "/contact",
    title: "Contact — Unfollow Tracker",
    description: "Get in touch about Unfollow Tracker bugs, questions, or feedback.",
    h1: "Contact Us",
    summary: "Email postmaster@igunfollowed.com for questions or bug reports.",
  },
  {
    path: "/blog",
    title: "Blog — Unfollow Tracker",
    description:
      "Guides on recent followers, private unfollow tracking, and Instagram data exports — no password required.",
    h1: "Blog",
    summary: "Guides on Instagram exports, recent followers, and private unfollow checks.",
  },
  {
    path: "/blog/recent-followers",
    title: "How to See Recent Followers on Instagram (No Login)",
    description:
      "Check recent followers on Instagram manually or with your official export. Sort by date followed, compare Followers snapshots, and analyze your ZIP privately on igunfollowed.com — no login required.",
    h1: "How to See Recent Followers on Instagram",
    summary: "How Instagram’s Followers list works and how a private ZIP compare can show new followers.",
    image: `${SITE}/images/recent-followers-featured.webp`,
    imageAlt: "How to see recent followers on Instagram — Followers list with recent dates highlighted",
    imageWidth: "1280",
    imageHeight: "720",
  },
  {
    path: "/instagram-font-generator",
    title: "Instagram Font Generator: 60+ Styles to Copy & Paste",
    description:
      "Free Instagram font generator with 60+ styles. Type your text, preview it for your bio, name or caption, and copy it in one tap. No signup needed.",
    h1: "Instagram Font Generator",
    summary: "Convert text to Unicode Instagram fonts in your browser and copy them into a bio or caption.",
  },
  {
    path: "/instagram-highlights-viewer",
    title: "Instagram Highlights Viewer: View & Download Free (No Login)",
    description:
      "Open public Instagram Highlights by username, step through stories, and download media. No Instagram login. Lookups go through our server API.",
    h1: "Instagram Highlights Viewer",
    summary: "Look up a public Instagram username to browse Highlights. This tool uses a server API, not your ZIP file.",
    image: `${SITE}/images/instagram-highlights-viewer-featured.webp`,
    imageAlt:
      "Instagram Highlights Viewer — browse public highlight covers and download stories without login",
    imageWidth: "1280",
    imageHeight: "720",
  },
  {
    path: "/instagram-grid-maker",
    title: "Instagram Grid Maker: Split Photos for Profile & Carousel",
    description:
      "Free Instagram grid maker — split one photo into a 3×3 profile grid or a swipeable carousel. Preview the real 3:4 thumbnail crop, then download tiles. No login, no upload.",
    h1: "Instagram Grid Maker",
    summary: "Split one photo into profile-grid or carousel tiles in this browser. The image is not uploaded.",
    image: `${SITE}/images/instagram-grid-maker-featured.jpg`,
    imageAlt: "Instagram Grid Maker — split one photo into a 3:4 profile grid or carousel, free, no login",
    imageWidth: "1280",
    imageHeight: "720",
  },
  {
    path: "/threads-unfollow-tracker",
    title: "Threads Unfollow Tracker: See Who Unfollowed You (2026)",
    description:
      "Find out who unfollowed you on Threads using your official Meta export. Free, no login — comparison runs fully in your browser.",
    h1: "Threads Unfollow Tracker",
    summary:
      "Upload a Threads export ZIP to see who doesn’t follow back. Compare two exports for unfollow history — all in this browser.",
    image: `${SITE}/images/threads-unfollow-tracker-featured.webp`,
    imageAlt: "Threads Unfollow Tracker: See Who Unfollowed You (2026)",
    imageWidth: "1280",
    imageHeight: "850",
    imageType: "image/webp",
  },
];

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function canonicalFor(path) {
  if (path === "/") return SITE;
  return `${SITE}${path}`;
}

function applyMeta(html, route) {
  const canonical = canonicalFor(route.path);
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  out = out.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${description}$2`,
  );
  out = out.replace(/(property="og:title"\s+content=")[^"]*(")/, `$1${title}$2`);
  out = out.replace(/(property="og:description"\s+content=")[^"]*(")/g, `$1${description}$2`);
  out = out.replace(/(name="twitter:title"\s+content=")[^"]*(")/, `$1${title}$2`);
  out = out.replace(/(name="twitter:description"\s+content=")[^"]*(")/g, `$1${description}$2`);

  const extra = [
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<noscript><h1>${escapeHtml(route.h1)}</h1><p>${escapeHtml(route.summary)}</p></noscript>`,
  ].join("\n    ");

  if (out.includes('rel="canonical"')) {
    out = out.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${canonical}" />`);
  } else {
    out = out.replace("</head>", `    ${extra}\n  </head>`);
  }
  if (!out.includes('property="og:url"')) {
    out = out.replace("</head>", `    <meta property="og:url" content="${canonical}" />\n  </head>`);
  } else {
    out = out.replace(/(property="og:url"\s+content=")[^"]*(")/, `$1${canonical}$2`);
  }
  if (!out.includes("<noscript>")) {
    out = out.replace("<div id=\"root\"></div>", `<div id="root"></div>\n    <noscript><h1>${escapeHtml(route.h1)}</h1><p>${escapeHtml(route.summary)}</p></noscript>`);
  }
  if (route.image) {
    const image = escapeHtml(route.image);
    out = out.replace(/(property="og:image"\s+content=")[^"]*(")/, `$1${image}$2`);
    out = out.replace(/(name="twitter:image"\s+content=")[^"]*(")/, `$1${image}$2`);
  }
  if (route.imageAlt) {
    const imageAlt = escapeHtml(route.imageAlt);
    out = out.replace(/(property="og:image:alt"\s+content=")[^"]*(")/, `$1${imageAlt}$2`);
    out = out.replace(/(name="twitter:image:alt"\s+content=")[^"]*(")/, `$1${imageAlt}$2`);
  }
  if (route.imageWidth) {
    out = out.replace(
      /(property="og:image:width"\s+content=")[^"]*(")/,
      `$1${escapeHtml(route.imageWidth)}$2`,
    );
  }
  if (route.imageHeight) {
    out = out.replace(
      /(property="og:image:height"\s+content=")[^"]*(")/,
      `$1${escapeHtml(route.imageHeight)}$2`,
    );
  }
  if (route.imageType) {
    const imageType = escapeHtml(route.imageType);
    if (out.includes('property="og:image:type"')) {
      out = out.replace(
        /(property="og:image:type"\s+content=")[^"]*(")/,
        `$1${imageType}$2`,
      );
    } else {
      out = out.replace(
        /(property="og:image:height"\s+content="[^"]*"\s*\/?>)/,
        `$1\n    <meta property="og:image:type" content="${imageType}" />`,
      );
    }
  }
  if (route.path !== "/") {
    out = out.replace(/<script id="home-jsonld"[\s\S]*?<\/script>/, "");
  }
  return out;
}

const home = ROUTES.find((route) => route.path === "/");
writeFileSync(join(dist, "index.html"), applyMeta(template, home));

for (const route of ROUTES) {
  if (route.path === "/") continue;
  const file = join(dist, route.path.replace(/^\//, ""), "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, applyMeta(template, route));
}

console.log(`prerender-routes: wrote unique HTML for ${String(ROUTES.length)} paths`);
