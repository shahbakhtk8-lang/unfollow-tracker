import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { parseZipFile } from "@/lib/parseClient";
import { useAnalyzerStore } from "@/store/analyzerStore";
import {
  FEATURED_IMAGE_ALT,
  FEATURED_IMAGE_HEIGHT,
  FEATURED_IMAGE_PATH,
  FEATURED_IMAGE_URL,
  FEATURED_IMAGE_WIDTH,
  HOME_META_DESCRIPTION,
  HOME_META_TITLE,
  SITE_URL,
  YOUTUBE_EMBED_URL,
  YOUTUBE_VIDEO_TITLE,
  buildHomeJsonLd,
  homeFaqs,
  howItWorksSteps,
} from "@/content/seo";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const features = [
  {
    icon: ShieldCheck,
    title: "Safe & secure",
    desc: "No login and password required. Manual checks only need your official ZIP. We never ask for your Instagram or Threads password, and signing in is optional. Your data is protected and secure at all times.",
  },
  {
    icon: Target,
    title: "100% accurate rate",
    desc: "The system compares your data with high precision to accurately reveal unfollowers.",
  },
  {
    icon: Zap,
    title: "Fast results",
    desc: "Get instant results with one click. You don't need to wait to check followers' status.",
  },
  {
    icon: TrendingUp,
    title: "Improve 50% growth",
    desc: "The unfollower tracker can increase your growth ratio by 50% by filtering out fake or inactive followers from your account.",
  },
  {
    icon: Trash2,
    title: "Auto deletion of data",
    desc: "Your data is analyzed securely. After you get your results, the uploaded data is auto-deleted from our system.",
  },
  {
    icon: Layers,
    title: "All-in-one tracking",
    desc: "Use both methods, username analysis and Instagram data export (ZIP file), for a more accurate and deeper comparison.",
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
    title: "Optimize your social circle",
    desc: "Adjust your follower list easily. Identify those who no longer follow you and make informed decisions about who to follow.",
  },
];

const benefits = [
  "Losing followers without knowing who left? You could be missing out on up to 30% of your reach.",
  "Our free Igunfollow tracker reads your exported data.",
  "It scans your username and matches your followers against who you follow.",
  "Spot recent unfollowers.",
  "Find accounts that don't follow you back.",
  "Check how healthy your account is.",
  "You don't need to login or provide your insta password.",
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
  const store = useAnalyzerStore();

  const goAnalyzeWithFile = async (file: File) => {
    navigate("/analyze");
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
      store.setError("Demo file is missing. Upload your own Instagram ZIP instead.");
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
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <motion.p
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mb-4 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
            >
              No password · Local analysis
            </motion.p>
            <motion.h1
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="font-display text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl"
            >
              Instagram Unfollow Tracker Free online -{" "}
              <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Without Login 2026
              </span>
            </motion.h1>
            <motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mt-5 max-w-lg text-lg text-muted"
            >
              Upload your official Instagram data export. Unfollow Tracker compares followers and
              following on your device — fast, free, and modern.
            </motion.p>
            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Button asChild size="lg">
                <Link to="/analyze">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button type="button" size="lg" variant="secondary" onClick={() => void tryDemo()}>
                Try demo (10 sec)
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <ZipDropzone onFile={(f) => void goAnalyzeWithFile(f)} label="Drop ZIP here to analyze" />
          </motion.div>
        </div>
        <figure className="mx-auto mt-16 max-w-6xl">
          <img
            src={FEATURED_IMAGE_PATH}
            width={FEATURED_IMAGE_WIDTH}
            height={FEATURED_IMAGE_HEIGHT}
            alt={FEATURED_IMAGE_ALT}
            fetchPriority="high"
            className="h-auto w-full rounded-2xl border border-border bg-card shadow-sm"
          />
        </figure>
      </section>

      <section id="how-it-works" className="border-t border-border/80 bg-card/30 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-center text-3xl font-bold"
          >
            How Does Igunfollow Tool Works?
          </motion.h2>
          <p className="mx-auto mt-4 max-w-3xl text-center text-muted">
            Our Unfollow Tracker tool analysis data given by you & give you 100% accurate results.
            There is no risk, completely free, just upload your zip file in the top box & you&apos;ll
            get the results of who didn&apos;t follow you back. Here are three simple steps to follow.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {howItWorksSteps.map((item, i) => (
              <motion.div
                key={item.step}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
              >
                <Card className="h-full border-border/80 bg-card/90">
                  <CardContent className="p-6">
                    <span className="font-display text-4xl font-extrabold text-primary/40">
                      {item.step}
                    </span>
                    <h3 className="font-display mt-2 text-xl font-bold">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted">{item.body}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <p className="mt-8 text-center">
            <Link to="/guide" className="text-sm font-semibold text-primary hover:underline">
              Full export guide →
            </Link>
          </p>
        </div>
      </section>

      <section id="video" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-center text-3xl font-bold">Watch how it works</h2>
          <div className="relative mt-10 aspect-video overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={YOUTUBE_EMBED_URL}
              title={YOUTUBE_VIDEO_TITLE}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
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
            The safest way to track your non-followers. Official exports, local analysis, and a
            clearer view of who you follow.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <f.icon className="h-8 w-8 text-primary" aria-hidden />
                <h3 className="font-display mt-4 font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted">{f.desc}</p>
              </motion.div>
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
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <Check className="h-8 w-8 text-primary" aria-hidden />
                <p className="mt-4 text-sm text-muted">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-center text-3xl font-bold">
            How Unfollow Tracker Increase Your Account Growth
          </h2>
          <Card className="mt-10 border-border/80 bg-card/90">
            <CardContent className="p-6 sm:p-8">
              <p className="text-sm leading-relaxed text-muted">
                On May 7, 2026, Instagram removed millions of bot and inactive accounts, so many
                users lose their follower count drop. Meta said the accounts that got banned or
                penalized were mostly fake or unused. A lower number is not always bad, because bots
                don&apos;t like, comment or share, and your real audience now makes up a bigger
                share. Real people can still unfollow you, and Instagram won&apos;t tell you who they
                are. Our Unfollow Tracker tool compares your followers and following lists, so you
                can see who left and decide who is important to keep.
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
            After checking your account with our free Unfollow Tracker tool, compare your numbers
            with these recommended unfollow and follow-back ranges. They help you tell whether your
            unfollow rate is normal or a warning sign.
          </p>
          <div className="article-prose mx-auto mt-10" style={{ maxWidth: "72rem" }}>
            <div className="article-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Account size</th>
                    <th scope="col">Normal daily unfollows</th>
                    <th scope="col">Healthy follow-back range</th>
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
            How to read it: if your daily unfollows are close to the range for your account size,
            that is normal. If they are much higher, take it as a warning sign and check who is
            leaving.
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
