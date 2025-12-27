'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bot, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';

export function SignInPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      toast({
        title: 'Sign in failed',
        description: err?.message ? String(err.message) : 'Please check your credentials.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="mx-auto max-w-sm">
        <CardHeader className="text-center">
          <div className="inline-flex justify-center items-center gap-2 mb-4">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-headline font-bold text-primary">
              ColonyGo
            </h1>
          </div>
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access your sales dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="#"
                  className="ml-auto inline-block text-sm underline text-blue-500"
                >
                  Forgot your password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" variant="accent" disabled={loading}>
              <LogIn className="mr-2" />
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
            <Button variant="outline" className="w-full">
              Sign in with Google
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="underline text-blue-500">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
