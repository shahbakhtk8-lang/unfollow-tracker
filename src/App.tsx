import { lazy, Suspense } from "react";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import HomePage from "@/pages/HomePage";

const AnalyzePage = lazy(() => import("@/pages/AnalyzePage"));
const GuidePage = lazy(() => import("@/pages/GuidePage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const DisclaimerPage = lazy(() => import("@/pages/DisclaimerPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const BlogPage = lazy(() => import("@/pages/BlogPage"));

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
      Loading…
    </div>
  );
}

/** Header/footer shell for non-tool pages. Tool pages bring their own via ToolPageLayout. */
function SiteShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route element={<SiteShell />}>
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/disclaimer" element={<DisclaimerPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
