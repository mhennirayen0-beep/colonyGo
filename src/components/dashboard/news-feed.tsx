import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { newsFeed } from "@/lib/data";

export function NewsFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">News Feed</CardTitle>
        <CardDescription>Recent updates on your opportunities.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {newsFeed.map((item) => (
            <div key={item.id} className="flex items-start gap-4">
              <Avatar>
                <AvatarImage src={item.user.avatarUrl} alt={item.user.name} />
                <AvatarFallback>{item.user.initials}</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p>
                  <span className="font-semibold">{item.user.name}</span>{" "}
                  {item.action}{" "}
                  <span className="font-semibold text-primary/90">{item.opportunityTitle}</span>.
                </p>
                <p className="text-xs text-muted-foreground">{item.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
