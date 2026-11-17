import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Layers,
  ListChecks,
  Monitor,
  ShieldCheck,
  Target,
  Trash2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ZipDropzone } from "@/components/analyzer/ZipDropzone";
import { YouTubeEmbed } from "@/components/content/YouTubeEmbed";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import {
  FEATURED_IMAGE_ALT,
  FEATURED_IMAGE_HEIGHT,
  FEATURED_IMAGE_HEIGHT_800,
  FEATURED_IMAGE_PATH,
  FEATURED_IMAGE_PATH_800,
  FEATURED_IMAGE_URL,
  FEATURED_IMAGE_WIDTH,
  FEATURED_IMAGE_WIDTH_800,
  HOME_META_DESCRIPTION,
  HOME_META_TITLE,
  SITE_URL,
  buildHomeJsonLd,
  homeFaqs,
} from "@/content/seo";

const features = [
  {
    icon: ShieldCheck,
    title: "No Instagram password",
    desc: "Igunfollowed never asks for your Instagram login. You use the official data export Instagram already gives you.",
  },
  {
    icon: Target,
    title: "Not-follow-back lists",
    desc: "Analyze your Instagram export to identify accounts that do not follow you back, plus mutuals and fans from the same file.",
  },
  {
    icon: Zap,
    title: "Fast results",
    desc: "After you choose a ZIP or JSON export, a background worker on this device reads the lists so you can review them here.",
  },
  {
    icon: TrendingUp,
    title: "Compare two exports",
    desc: "A single export cannot prove who recently unfollowed you. Save a snapshot or upload an older ZIP and a newer ZIP to see who left.",
  },
  {
    icon: Trash2,
    title: "Optional snapshots on this device",
    desc: "If you save a snapshot, username lists stay in IndexedDB in this browser until you delete them or clear site data. ZIP files are not uploaded to our servers.",
  },
  {
    icon: Layers,
    title: "ZIP or JSON export",
    desc: "Upload a full Instagram ZIP or the official followers and following JSON files. There is no username lookup for unfollow checks.",
  },
  {
    icon: Monitor,
    title: "Analysis in your browser",
    desc: "Analysis starts when you choose the ZIP. Your browser reads the file locally, so the archive itself is not uploaded to our servers.",
  },
  {
    icon: ListChecks,
    title: "Clear follower lists",
    desc: "Spot non-mutual follows and compare exports from different dates. Search the lists and decide for yourself who to keep following.",
  },
  {
    icon: Users,
    title: "Review who you follow",
    desc: "Use the lists to decide who to keep following. Igunfollowed does not unfollow anyone for you and does not change your Instagram account.",
  },
];

const benefits = [
  "A non-followback is an account you follow that is not on your followers list in this export.",
  "Igunfollowed reads followers and following from your official Instagram export.",
  "Compare those two lists in this browser — no Instagram password.",
  "Compare two exports when you want to see who disappeared from your followers list.",
  "Find accounts that don't follow you back.",
  "Optional snapshots stay on this device so you can compare later.",
  "Need the file first? Follow the export guide, then upload it on Analyze.",
];

const healthRanges = [
  {
    size: "Followers under 1k",
    unfollows: "1 – 2 per day",
    followBack: "10% – 20%",
  },
  {
    size: "Followers 5k – 10k",
    unfollows: "3 – 4 per day",
    followBack: "15% – 25%",
  },
  {
    size: "Followers 10k – 50k",
    unfollows: "5 – 10 per day",
    followBack: "20% – 30%",
  },
];

export default function HomePage() {
  const jsonLd = useMemo(() => buildHomeJsonLd(), []);
  useDocumentMeta({
    title: HOME_META_TITLE,
    description: HOME_META_DESCRIPTION,
    canonical: `${SITE_URL}/`,
    image: FEATURED_IMAGE_URL,
    imageAlt: FEATURED_IMAGE_ALT,
    imageWidth: FEATURED_IMAGE_WIDTH,
    imageHeight: FEATURED_IMAGE_HEIGHT,
    jsonLd,
  });
  const navigate = useNavigate();

  const goAnalyzeWithFile = async (file: File) => {
    navigate("/analyze");
    const [{ parseZipFile }, { useAnalyzerStore }] = await Promise.all([
      import("@/lib/parseClient"),
      import("@/store/analyzerStore"),
    ]);
    const store = useAnalyzerStore.getState();
    store.setParsing(true);
    store.setError(null);
    store.setProgress({ stage: "reading", percent: 0, message: "Starting…" });
    try {
      const result = await parseZipFile(file, (p) => store.setProgress(p));
      store.setResults({
        fileName: file.name,
        insights: result.insights,
        followerUsernames: result.followerUsernames,
        followingUsernames: result.followingUsernames,
        followerTimestamps: result.followerTimestamps,
        followingTimestamps: result.followingTimestamps,
        exportDate: result.exportDate,
        exportDateSource: result.exportDateSource,
      });
    } catch (e) {
      store.setError(e instanceof Error ? e.message : "Parse failed");
      store.setParsing(false);
      store.setProgress(null);
    }
  };

  const tryDemo = async () => {
    const res = await fetch("/demo/instagram-demo.zip");
    if (!res.ok) {
      navigate("/analyze");
      const { useAnalyzerStore } = await import("@/store/analyzerStore");
      useAnalyzerStore.getState().setError("Demo file is missing. Upload your own Instagram ZIP instead.");
      return;
    }
    const blob = await res.blob();
    const file = new File([blob], "instagram-demo.zip", { type: "application/zip" });
    await goAnalyzeWithFile(file);
  };

  return (
    <ToolPageLayout toolSlug="unfollow-tracker">
      <div className="mesh-bg">
      <section className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pt-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              No password · Local analysis
            </p>
            <h1 className="font-display text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
              Instagram Unfollow Tracker Free online -{" "}
              <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Without Login 2026
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted">
              Igunfollowed is an Instagram unfollow tracker. Upload your official data export and
              compare followers with following on this device. A non-followback means you follow
              someone who is not following you in that file.
            </p>
            <p className="mt-3 max-w-lg text-sm text-muted">
              Need the ZIP first? Read the{" "}
              <Link
                to="/guide"
                className="font-semibold text-primary underline underline-offset-2 hover:text-accent"
              >
                Instagram export guide
              </Link>
              . The same export can also list{" "}
              <Link
                to="/pending-requests"
                className="font-semibold text-primary underline underline-offset-2 hover:text-accent"
              >
                pending follow requests
              </Link>
              .
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/analyze">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button type="button" size="lg" variant="secondary" onClick={() => void tryDemo()}>
                Try demo (10 sec)
              </Button>
            </div>
          </div>

          <div>
            <ZipDropzone onFile={(f) => void goAnalyzeWithFile(f)} label="Drop ZIP here to analyze" />
          </div>
        </div>
        <figure className="mx-auto mt-16 max-w-6xl">
          <img
            src={FEATURED_IMAGE_PATH_800}
            srcSet={`${FEATURED_IMAGE_PATH_800} ${String(FEATURED_IMAGE_WIDTH_800)}w, ${FEATURED_IMAGE_PATH} ${String(FEATURED_IMAGE_WIDTH)}w`}
            sizes="(min-width: 1152px) 1152px, calc(100vw - 32px)"
            width={FEATURED_IMAGE_WIDTH_800}
            height={FEATURED_IMAGE_HEIGHT_800}
            alt={FEATURED_IMAGE_ALT}
            loading="lazy"
            decoding="async"
            className="h-auto w-full rounded-2xl border border-border bg-card shadow-sm"
          />
        </figure>
      </section>

      <section id="video" className="border-t border-border/80 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-center text-3xl font-bold">Watch the demo</h2>
          <div className="relative mt-10 aspect-video overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <YouTubeEmbed />
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-center text-3xl font-bold">Why Use Unfollow Tracker Tool?</h2>
          <p className="font-display mt-3 text-center text-lg font-semibold">
            Why Choose Our Unfollower Tool?
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted">
            Official Instagram exports, ZIP analysis in this browser, and a clearer view of who you
            follow — without an Instagram password.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <f.icon className="h-8 w-8 text-primary" aria-hidden />
                <h3 className="font-display mt-4 font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/80 bg-card/30 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-center text-3xl font-bold">
            Benefits of Using Our Unfollow Tracker Tool
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <Check className="h-8 w-8 text-primary" aria-hidden />
                <p className="mt-4 text-sm text-muted">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-center text-3xl font-bold">
            What a follower drop can mean
          </h2>
          <Card className="mt-10 border-border/80 bg-card/90">
            <CardContent className="p-6 sm:p-8">
              <p className="text-sm leading-relaxed text-muted">
                On May 7, 2026, Instagram removed millions of bot and inactive accounts, so many
                users saw their follower count drop. Meta said the accounts that got banned or
                penalized were mostly fake or unused. A lower number is not always bad, because bots
                don&apos;t like, comment or share, and your real audience now makes up a bigger
                share. Real people can still unfollow you, and Instagram won&apos;t name them. One
                Igunfollowed export shows who does not follow you back in that file. Comparing two
                exports shows who disappeared from your followers list between those dates.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-t border-border/80 bg-card/30 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-center text-3xl font-bold">
            Instagram Follower Health Ranges
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-center text-muted">
            These rows are informal illustrations, not official Instagram statistics and not a
            growth forecast. After you have real counts from your own export, use them only as a
            rough sense of scale.
          </p>
          <div className="article-prose mx-auto mt-10" style={{ maxWidth: "72rem" }}>
            <div className="article-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Account size</th>
                    <th scope="col">Informal daily unfollow example</th>
                    <th scope="col">Informal follow-back example</th>
                  </tr>
                </thead>
                <tbody>
                  {healthRanges.map((row) => (
                    <tr key={row.size}>
                      <td>{row.size}</td>
                      <td>{row.unfollows}</td>
                      <td>{row.followBack}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-muted">
            How to read it: if your daily unfollows are close to the example for your account size,
            that is only a rough comparison. If they are much higher, look at who is leaving in a
            two-export comparison rather than treating this table as a diagnosis.
          </p>
        </div>
      </section>

      <section className="border-t border-border px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-center text-2xl font-bold">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="mt-8">
            {homeFaqs.map((item, index) => (
              <AccordionItem key={item.question} value={`home-faq-${String(index)}`}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
      </div>
    </ToolPageLayout>
  );
}
