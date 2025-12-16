import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { opportunities } from "@/lib/data";
import { Briefcase, Trophy, CircleX } from "lucide-react";

export function StatsCards() {
  const totalOpportunities = opportunities.length;
  const wonOpportunities = opportunities.filter((o) => o.stage === 'Won').length;
  const lostOpportunities = opportunities.filter((o) => o.stage === 'Lost').length;

  const stats = [
    {
      title: "Total Opportunities",
      value: totalOpportunities,
      icon: Briefcase,
      color: "text-primary"
    },
    {
      title: "Opportunities Won",
      value: wonOpportunities,
      icon: Trophy,
      color: "text-green-500"
    },
    {
      title: "Opportunities Lost",
      value: lostOpportunities,
      icon: CircleX,
      color: "text-destructive"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
