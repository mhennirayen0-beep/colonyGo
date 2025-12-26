import { Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AIProvenanceIcon({ className }: { className?: string }) {
  return <Settings2 className={cn('h-4 w-4 text-primary opacity-80', className)} />;
}
