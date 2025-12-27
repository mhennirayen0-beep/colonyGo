
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bot } from 'lucide-react';
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

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(displayName, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      toast({
        title: 'Registration failed',
        description: err?.message ? String(err.message) : 'Please check your details.',
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
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>
            Enter your details to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
             <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
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
                <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" variant="accent" disabled={loading}>
              Create Account
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/" className="underline text-blue-500">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
