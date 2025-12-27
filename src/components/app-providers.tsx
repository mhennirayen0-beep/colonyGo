'use client';

import React from 'react';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { AbilityProvider } from '@/lib/ability';

function AbilityBridge({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return <AbilityProvider user={user}>{children}</AbilityProvider>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AbilityBridge>{children}</AbilityBridge>
    </AuthProvider>
  );
}
