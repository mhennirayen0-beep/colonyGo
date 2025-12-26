'use client';

import { useMemo, useState } from 'react';
import { Bot, Mic, Paperclip, SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type GyneAIBarProps = {
  className?: string;
};

/**
 * GyneAI assistant bar (fixed bottom).
 * Spec: persistent assistant at the bottom of the screen with input + upload + mic + send.
 * UI-only for now; wire it to your AI flows later.
 */
export function GyneAIBar({ className }: GyneAIBarProps) {
  const [value, setValue] = useState('');
  const canSend = useMemo(() => value.trim().length > 0, [value]);

  const handleSend = () => {
    if (!canSend) return;
    // TODO: wire to AI flow
    setValue('');
  };

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80',
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-3 py-2 sm:px-6">
        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">GyneAI</div>
            <div className="text-xs text-muted-foreground">Assistant</div>
          </div>
        </div>

        <div className="flex flex-1 items-center gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask GyneAI…"
            className="h-10"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button variant="ghost" size="icon" className="shrink-0" aria-label="Upload file">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="shrink-0" aria-label="Voice input">
            <Mic className="h-4 w-4" />
          </Button>
          <Button
            variant={canSend ? 'accent' : 'secondary'}
            size="icon"
            className="shrink-0"
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Send"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
