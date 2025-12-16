import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AIProvenanceIcon({ className }: { className?: string }) {
  return (
    <Sparkles
      className={cn(
        'h-4 w-4 text-primary opacity-80',
        className
      )}
    />
  );
}
