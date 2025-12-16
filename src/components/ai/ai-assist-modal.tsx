"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bot, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { generateReport } from '@/ai/flows/ai-assisted-report-generation';
import { useToast } from '@/hooks/use-toast';
import { AIProvenanceIcon } from './ai-provenance-icon';
import { Card, CardContent } from '../ui/card';

const formSchema = z.object({
  prompt: z.string().min(10, {
    message: 'Prompt must be at least 10 characters.',
  }),
});

export function AIAssistModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setReport(null);
    try {
      const result = await generateReport(values);
      setReport(result.report);
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
      setReport(null);
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Bot className="h-4 w-4" />
          <span className="sr-only">AI Assistant</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <AIProvenanceIcon className="h-5 w-5" />
            GyneAI Assistant
          </DialogTitle>
          <DialogDescription>
            Automate tasks like report creation. What would you like to do?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {!report && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Generate Sales Report</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., 'Generate a quarterly sales report summarizing won vs. lost opportunities and top-performing products.'"
                          className="min-h-[100px]"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Report'
                  )}
                </Button>
              </form>
            </Form>
          )}
          {report && (
            <div className="space-y-4">
              <h4 className="font-medium">Generated Report</h4>
              <Card>
                <CardContent className="p-4 text-sm whitespace-pre-wrap font-mono bg-secondary rounded-lg">
                  {report}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>Close</Button>
            {report && (
                 <Button onClick={() => { setReport(null); form.reset(); }}>
                    Generate Another
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
