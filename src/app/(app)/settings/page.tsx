
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const notificationsFormSchema = z.object({
  type: z.enum(['all', 'mentions', 'none'], {
    required_error: 'You need to select a notification type.',
  }),
  mobile: z.object({
    opportunities: z.boolean().default(false).optional(),
    news: z.boolean().default(false).optional(),
  }),
  communication_emails: z.boolean().default(false).optional(),
  marketing_emails: z.boolean().default(false).optional(),
  social_emails: z.boolean().default(false).optional(),
  security_emails: z.boolean().default(true),
});

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;

const defaultValues: Partial<NotificationsFormValues> = {
  communication_emails: false,
  marketing_emails: false,
  social_emails: true,
  security_emails: true,
  type: 'all',
  mobile: {
    opportunities: true,
    news: false,
  },
};

export default function SettingsPage() {
  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues,
  });

  function onSubmit(data: NotificationsFormValues) {
    toast({
      title: 'Settings saved!',
      description: 'Your notification preferences have been updated.',
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and notification settings.
        </p>
      </div>
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Notify me about...</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="all" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        All new messages
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="mentions" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Direct messages and mentions
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="none" />
                      </FormControl>
                      <FormLabel className="font-normal">Nothing</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <h3 className="mb-4 text-lg font-medium">Email Notifications</h3>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="communication_emails"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Communication emails
                      </FormLabel>
                      <FormDescription>
                        Receive emails about your account activity.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="marketing_emails"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Marketing emails
                      </FormLabel>
                      <FormDescription>
                        Receive emails about new products, features, and more.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="security_emails"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Security emails
                      </FormLabel>
                      <FormDescription>
                        Receive emails about your account security.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled
                        aria-readonly
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="mobile"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">Push Notifications</FormLabel>
                  <FormDescription>
                    These are delivered via SMS to your mobile phone.
                  </FormDescription>
                </div>
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="mobile.opportunities"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>New Opportunities</FormLabel>
                          <FormDescription>
                            Get notified when a new opportunity is assigned to you.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobile.news"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>News Feed Updates</FormLabel>
                          <FormDescription>
                            Get notified about major updates in your news feed.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">Update notifications</Button>
        </form>
      </Form>
    </div>
  );
}
