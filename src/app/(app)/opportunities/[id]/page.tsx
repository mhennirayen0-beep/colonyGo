import { opportunities, customers, users } from "@/lib/data";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Briefcase,
  User,
  DollarSign,
  BarChart,
  Shield,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  MessageSquare,
} from "lucide-react";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const phaseVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  Prospection: "outline",
  Discovery: "secondary",
  Evaluation: "default",
  Deal: "outline",
};

const statusColor: { [key: string]: string } = {
  Forecast: "bg-status-forecast text-white",
  Start: "bg-status-start text-white",
  Stop: "bg-status-stop text-white",
  Cancelled: "bg-status-cancelled text-white",
};

function InfoCard({ icon: Icon, title, value }: { icon: React.ElementType; title: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-primary mt-1" />
            <div>
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="text-sm font-semibold">{value}</p>
            </div>
        </div>
    )
}

function SwotCard({ title, icon: Icon, value, color }: { title: string; icon: React.ElementType; value: number; color: string; }) {
    return (
        <Card className="flex-1">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${color}`} />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{value}/5</p>
            </CardContent>
        </Card>
    );
}

export default function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const opportunity = opportunities.find((opp) => opp.id === params.id);

  if (!opportunity) {
    notFound();
  }
  
  const customer = customers.find(c => c.id === opportunity.customerid);
  const owner = users.find(u => u.displayName === opportunity.opportunityowner);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary">{opportunity.opportunityname}</h1>
        <p className="text-muted-foreground">{opportunity.opportunitydescription}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
            {/* Value Chain */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Value Chain</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <InfoCard icon={DollarSign} title="Forecast Value" value={formatCurrency(opportunity.value_forecast)} />
                    <InfoCard icon={DollarSign} title="Final Value" value={formatCurrency(opportunity.value_final)} />
                    <InfoCard icon={DollarSign} title="Discount" value={formatCurrency(opportunity.value_discount)} />
                    <InfoCard icon={DollarSign} title="Budget" value={formatCurrency(opportunity.value_budget)} />
                    <InfoCard icon={DollarSign} title="Customer Value" value={formatCurrency(opportunity.value_customer)} />
                    <InfoCard icon={DollarSign} title="Bonus" value={formatCurrency(opportunity.value_bonus)} />
                </CardContent>
            </Card>

            {/* SWOT Analysis */}
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">SWOT Analysis</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                   <SwotCard title="Strengths" icon={ThumbsUp} value={opportunity.swot_strength} color="text-status-start" />
                   <SwotCard title="Weaknesses" icon={ThumbsDown} value={opportunity.swot_weakness} color="text-status-stop" />
                   <SwotCard title="Opportunities" icon={Zap} value={opportunity.swot_opportunities} color="text-status-forecast" />
                   <SwotCard title="Threats" icon={Shield} value={opportunity.swot_threats} color="text-status-cancelled" />
                </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Notes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" /> Notes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">No notes added yet.</p>
                    </CardContent>
                </Card>

                {/* Files */}
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <Paperclip className="h-5 w-5" /> Files
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <InfoCard icon={Briefcase} title="Client" value={customer?.name || 'N/A'} />
                <Separator />
                <InfoCard 
                    icon={User} 
                    title="Owner" 
                    value={
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={owner?.photoURL} />
                                <AvatarFallback>{owner?.initials}</AvatarFallback>
                            </Avatar>
                            <span>{owner?.displayName}</span>
                        </div>
                    } 
                />
                <Separator />
                 <InfoCard 
                    icon={BarChart} 
                    title="Phase & Status" 
                    value={
                        <div className="flex items-center gap-2">
                            <Badge variant={phaseVariant[opportunity.opportunityphase]}>{opportunity.opportunityphase}</Badge>
                            <Badge className={statusColor[opportunity.opportunitystatut]}>{opportunity.opportunitystatut}</Badge>
                        </div>
                    } 
                />
            </CardContent>
          </Card>
           <Card>
              <CardHeader>
                <CardTitle className="font-headline">Price Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Hardware</span>
                      <span className="font-semibold">{formatCurrency(opportunity.hardware_price)}</span>
                  </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Software</span>
                      <span className="font-semibold">{formatCurrency(opportunity.software_price)}</span>
                  </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Service</span>
                      <span className="font-semibold">{formatCurrency(opportunity.service_price)}</span>
                  </div>
                  <Separator />
                   <div className="flex justify-between items-center text-sm font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(opportunity.hardware_price + opportunity.software_price + opportunity.service_price)}</span>
                  </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
