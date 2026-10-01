import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Zap, Target, Sparkles, ArrowRight } from "lucide-react";
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
import { parseZipFile } from "@/lib/parseClient";
import { useAnalyzerStore } from "@/store/analyzerStore";

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
    icon: Lock,
    title: "100% local",
    desc: "Your ZIP is parsed in your browser. We never receive your archive.",
  },
  {
    icon: Zap,
    title: "Built for speed",
    desc: "Web Workers + virtual lists keep scrolling smooth even with huge exports.",
  },
  {
    icon: Target,
    title: "Accurate lists",
    desc: "Official Meta export data — non-mutuals, mutuals, fans, and snapshot diffs.",
  },
  {
    icon: Sparkles,
    title: "Free to use",
    desc: "No Instagram password. No subscription. Export results as CSV anytime.",
  },
];

export default function HomePage() {
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
    <ToolPageLayout articleSlug="unfollow-tracker" toolSlug="unfollow-tracker">
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
              className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
            >
              See who doesn&apos;t follow you back —{" "}
              <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                privately
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
      </section>

      <section id="how-it-works" className="border-t border-border/80 bg-card/30 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-center text-3xl font-bold"
          >
            How it works
          </motion.h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Export from Meta",
                body: "Accounts Center → Export your information → Followers and following → All time.",
              },
              {
                step: "2",
                title: "Upload ZIP here",
                body: "Drag the archive into Unfollow Tracker. It stays on your device — never uploaded.",
              },
              {
                step: "3",
                title: "Review lists",
                body: "See non-mutuals, mutuals, and fans. Save snapshots to track unfollows later.",
              },
            ].map((item, i) => (
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

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-center text-3xl font-bold">Why Unfollow Tracker?</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <section className="border-t border-border px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-center text-2xl font-bold">FAQ</h2>
          <Accordion type="single" collapsible className="mt-8">
            <AccordionItem value="1">
              <AccordionTrigger>Do you store my Instagram data?</AccordionTrigger>
              <AccordionContent>
                No. Your ZIP is read locally in your browser. Optional snapshots save only username
                lists on this device via IndexedDB — not on our servers.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="2">
              <AccordionTrigger>How do I see who unfollowed me?</AccordionTrigger>
              <AccordionContent>
                Instagram does not include an unfollower history. Save a snapshot from an older
                export, then upload a newer ZIP with Compare enabled to see who disappeared from
                your followers list.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="3">
              <AccordionTrigger>Do I need my Instagram password?</AccordionTrigger>
              <AccordionContent>
                Never. We only support Meta&apos;s official data download (ZIP file). That keeps
                your account safe and within platform rules.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
      </div>
    </ToolPageLayout>
  );
}
