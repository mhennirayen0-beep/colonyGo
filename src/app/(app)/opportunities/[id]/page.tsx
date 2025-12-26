'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { customers, users } from '@/lib/data';
import { useOpportunitiesStore } from '@/lib/opportunities-store';
import type { Opportunity } from '@/lib/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

import {
  ArrowLeft,
  BarChart3,
  Briefcase,
  DollarSign,
  FileText,
  Pencil,
  Shield,
  ThumbsDown,
  ThumbsUp,
  User,
  Zap,
} from 'lucide-react';

import { OpportunityDialog } from '@/components/opportunities/opportunity-dialog';
import { OpportunityNotes } from '@/components/opportunities/opportunity-notes';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const phaseVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Prospection: 'outline',
  Discovery: 'secondary',
  Evaluation: 'default',
  Deal: 'outline',
};

const statusColor: Record<string, string> = {
  Forecast: 'bg-status-forecast text-white',
  Start: 'bg-status-start text-white',
  Stop: 'bg-status-stop text-white',
  Cancelled: 'bg-status-cancelled text-white',
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function InfoCard({ icon: Icon, title, value }: { icon: React.ElementType; title: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-1 h-5 w-5 text-primary" />
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}

function SwotCard({ title, icon: Icon, value, color }: { title: string; icon: React.ElementType; value: number; color: string }) {
  return (
    <Card className="flex-1 rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
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

export default function OpportunityDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { getOpportunityById } = useOpportunitiesStore();
  const opportunity = getOpportunityById(params.id);

  const [editOpen, setEditOpen] = useState(false);

  const customer = useMemo(
    () => customers.find((c) => c.id === opportunity?.customerid),
    [opportunity?.customerid]
  );
  const owner = useMemo(
    () => users.find((u) => u.displayName === opportunity?.opportunityowner),
    [opportunity?.opportunityowner]
  );

  const computed = useMemo(() => {
    if (!opportunity) return null;
    const totalPrice = (opportunity.hardware_price ?? 0) + (opportunity.software_price ?? 0) + (opportunity.service_price ?? 0);
    const discountRate = opportunity.value_forecast > 0 ? (opportunity.value_discount / opportunity.value_forecast) * 100 : 0;
    const winGap = opportunity.value_final - opportunity.value_forecast;
    const swotAvg =
      (Number(opportunity.swot_strength) + Number(opportunity.swot_weakness) + Number(opportunity.swot_opportunities) + Number(opportunity.swot_threats)) / 4;
    return {
      totalPrice,
      discountRate,
      winGap,
      swotAvg,
    };
  }, [opportunity]);

  if (!opportunity) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/opportunities')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline">Opportunity not found</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">The opportunity id <span className="font-mono">{params.id}</span> doesn't exist in the current dataset.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/opportunities" className="text-sm text-muted-foreground hover:text-foreground">
              <span className="inline-flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</span>
            </Link>
            <Badge variant="outline" className="font-mono">{opportunity.id}</Badge>
          </div>
          <h1 className="font-headline text-3xl font-bold text-primary">{opportunity.opportunityname}</h1>
          <p className="text-sm text-muted-foreground">{opportunity.opportunitydescription || '—'}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="secondary" asChild>
            <Link href={`/opportunities?mode=data&query=${encodeURIComponent(opportunity.opportunityname)}`}>
              <BarChart3 className="mr-2 h-4 w-4" /> Find in Data
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Stats */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow label="Total Price" value={formatCurrency(computed?.totalPrice ?? 0)} />
              <InfoRow label="Discount Rate" value={`${(computed?.discountRate ?? 0).toFixed(1)}%`} />
              <InfoRow label="Final vs Forecast" value={`${computed?.winGap! >= 0 ? '+' : ''}${formatCurrency(computed?.winGap ?? 0)}`} />
              <InfoRow label="SWOT Avg" value={`${(computed?.swotAvg ?? 0).toFixed(1)}/5`} />
            </CardContent>
          </Card>

          {/* Value Chain */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Value Chain</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6 md:grid-cols-3">
              <InfoCard icon={DollarSign} title="Forecast Value" value={formatCurrency(opportunity.value_forecast)} />
              <InfoCard icon={DollarSign} title="Final Value" value={formatCurrency(opportunity.value_final)} />
              <InfoCard icon={DollarSign} title="Discount" value={formatCurrency(opportunity.value_discount)} />
              <InfoCard icon={DollarSign} title="Budget" value={formatCurrency(opportunity.value_budget)} />
              <InfoCard icon={DollarSign} title="Customer Value" value={formatCurrency(opportunity.value_customer)} />
              <InfoCard icon={DollarSign} title="Bonus" value={formatCurrency(opportunity.value_bonus)} />
            </CardContent>
          </Card>

          {/* SWOT Analysis */}
          <Card className="rounded-2xl shadow-sm">
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

          {/* Notes (action inside details as requested) */}
          <OpportunityNotes opportunityId={opportunity.id} />

          {/* Files (prototype placeholder) */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><FileText className="h-5 w-5" /> Files</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              No files attached yet. (Prototype) — in next iteration this can connect to Colony Files.
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoCard icon={Briefcase} title="Client" value={customer?.name || opportunity.customername || 'N/A'} />
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
                    <span>{opportunity.opportunityowner}</span>
                  </div>
                }
              />
              <Separator />
              <InfoCard
                icon={BarChart3}
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

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Price Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Hardware" value={formatCurrency(opportunity.hardware_price)} />
              <InfoRow label="Software" value={formatCurrency(opportunity.software_price)} />
              <InfoRow label="Service" value={formatCurrency(opportunity.service_price)} />
              <Separator />
              <InfoRow
                label="Total"
                value={<span className="text-base font-bold">{formatCurrency(computed?.totalPrice ?? 0)}</span>}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">SCL</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">
              {opportunity.opportunityscl || '—'}
            </CardContent>
          </Card>
        </div>
      </div>

      <OpportunityDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        opportunity={opportunity as Opportunity}
        onFormSubmit={() => setEditOpen(false)}
      />
    </div>
  );
}
