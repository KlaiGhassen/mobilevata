'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

/** Bootstraps the Zustand auth session once at app start. */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return children;
}
