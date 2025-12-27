import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { newsFeed } from "@/lib/data";

export function NewsFeed({
  items,
}: {
  items?: Array<{ id: string; action: string; opportunityTitle: string; timestamp: string } & any>;
}) {
  const data = items && Array.isArray(items) ? items : newsFeed;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">News Feed</CardTitle>
        <CardDescription>Recent updates on your opportunities.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((item) => (
            <div key={item.id} className="flex items-start gap-4">
              <Avatar>
                <AvatarFallback>{item.user?.initials ?? 'CG'}</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p>
                  <span className="font-semibold">{item.user?.displayName ?? 'System'}</span>{" "}
                  {item.action}{" "}
                  <span className="font-semibold text-primary/90">{item.opportunityTitle}</span>.
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
