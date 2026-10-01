import { Link } from "react-router-dom";
import { FileText, Shield, Sparkles, Users } from "lucide-react";
import { relatedLiveTools, type ToolIconName } from "@/content/tools";

const icons: Record<ToolIconName, typeof Shield> = {
  shield: Shield,
  users: Users,
  "file-text": FileText,
  sparkles: Sparkles,
};

export function RelatedTools({ toolSlug }: { toolSlug: string }) {
  const others = relatedLiveTools(toolSlug);
  if (others.length === 0) return null;

  return (
    <section className="border-t border-border px-4 py-16 sm:px-6" aria-labelledby="related-tools-heading">
      <div className="mx-auto max-w-6xl">
        <h2 id="related-tools-heading" className="font-display text-2xl font-bold">
          More tools
        </h2>
        <ul className="mt-8 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((tool) => {
            const Icon = icons[tool.icon];
            return (
              <li key={tool.slug}>
                <Link
                  to={tool.href}
                  className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <Icon className="h-8 w-8 text-primary" aria-hidden />
                  <span className="font-display mt-4 font-bold text-foreground">{tool.name}</span>
                  <span className="mt-2 text-sm text-muted">{tool.shortDescription}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
