"use client";

import { Bell, Bot } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { alerts } from '@/lib/data';
import { AIProvenanceIcon } from './ai-provenance-icon';

export function AIAlertsPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {alerts.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary/90"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="grid gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
               <AIProvenanceIcon />
               <h3 className="font-headline font-medium leading-none">AI-Powered Alerts</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Automated insights from GyneAI.
            </p>
          </div>
          <div className="grid gap-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0"
              >
                <span className="flex h-2 w-2 translate-y-1 rounded-full bg-accent" />
                <div className="grid gap-1">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                  <p className="text-xs text-muted-foreground/80">
                    <span className='font-semibold'>{alert.opportunityTitle}</span> - {alert.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
