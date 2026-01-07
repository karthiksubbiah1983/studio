'use client';

import { AuthProvider } from '@/hooks/use-auth';
import { BuilderProvider } from '@/hooks/use-builder';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BuilderProvider>{children}</BuilderProvider>
    </AuthProvider>
  );
}
