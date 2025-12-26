import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function ModuleShell({
  title,
  subtitle,
  status = "Prototype",
  children
}: {
  title: string;
  subtitle?: string;
  status?: "Prototype" | "Coming soon" | "In progress";
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-headline text-2xl font-semibold text-primary">{title}</h1>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <Badge variant="secondary" className="w-fit">{status}</Badge>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Overview</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This screen is a working prototype to validate navigation and UI patterns.
            We can plug real data / services later.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">GyneAI</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Use the assistant bar at the bottom to brainstorm workflows and generate summaries.
          </CardContent>
        </Card>
      </div>

      {children}
    </div>
  );
}
