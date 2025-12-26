import { ModuleShell } from "@/components/modules/module-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const links = [
  { title: "Product Wiki", desc: "Specs, workflows, UX patterns, terminology.", href: "https://example.com/wiki" },
  { title: "Data Catalog", desc: "Data model and variable specification.", href: "https://example.com/data-catalog" },
  { title: "Support", desc: "Support hub / help center.", href: "https://example.com/support" },
];

export default function NavigatorPage() {
  return (
    <ModuleShell
      title="Navigator"
      subtitle="Quick links to documentation, wiki, and knowledge bases"
      status="Prototype"
    >
      <div className="grid gap-4 md:grid-cols-3">
        {links.map((l) => (
          <Card key={l.title} className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">{l.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{l.desc}</p>
              <a
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                Open link <Badge variant="secondary">External</Badge>
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </ModuleShell>
  );
}
