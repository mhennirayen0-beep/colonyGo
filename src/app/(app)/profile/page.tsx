'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth-context';
import { api, setTokens } from '@/lib/api-client';

const profileFormSchema = z.object({
  displayName: z
    .string()
    .min(2, {
      message: 'Name must be at least 2 characters.',
    }),
  email: z
    .string({
      required_error: 'Please enter an email.',
    })
    .email(),
  bio: z.string().max(160).optional(),
});

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm the new password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfilePage() {
  const { user, refreshMe } = useAuth();

  const initials = (user?.displayName || user?.email || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      email: user?.email || '',
      bio: user?.bio || ""
    },
    mode: 'onChange',
  });

  const passForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  async function onSubmit(data: ProfileFormValues) {
    try {
      const res = await api.patch('/auth/profile', {
        displayName: data.displayName,
        email: data.email,
        bio: data.bio || '',
      });
      if ((res as any)?.accessToken && (res as any)?.refreshToken) {
        // token rotation may happen on profile update
        setTokens((res as any).accessToken, (res as any).refreshToken);
      }
      await refreshMe();
      toast({ title: 'Profile updated', description: 'Your profile has been saved.' });
    } catch (e: any) {
      toast({ title: 'Update failed', description: e?.message ? String(e.message) : undefined, variant: 'destructive' });
    }
  }

  async function onChangePassword(data: PasswordFormValues) {
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      if ((res as any)?.accessToken && (res as any)?.refreshToken) {
        setTokens((res as any).accessToken, (res as any).refreshToken);
      }
      await refreshMe();
      passForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast({ title: 'Password updated', description: 'Your password has been changed.' });
    } catch (e: any) {
      toast({ title: 'Password update failed', description: e?.message ? String(e.message) : undefined, variant: 'destructive' });
    }
  }

  if (!user) return <div className="text-sm text-muted-foreground">No user session.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline font-bold text-primary">Profile</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={''} alt={user.displayName} />
              <AvatarFallback>{initials || '?'}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{user.displayName}</CardTitle>
              <CardDescription>
                Update your photo and personal details.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is your public display name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Your email address"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This is the email address that will be associated with
                      your account.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us a little bit about yourself"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description of your role.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="accent">Update profile</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Change your password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passForm}>
            <form onSubmit={passForm.handleSubmit(onChangePassword)} className="space-y-6">
              <FormField
                control={passForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="accent">Update password</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
