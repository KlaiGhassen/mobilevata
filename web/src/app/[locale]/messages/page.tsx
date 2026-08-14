import { Suspense } from 'react';
import { PageShell } from '@/components/PageShell';
import { MessagesSkeleton } from '@/components/LoadingBlock';
import MessagesPageClient from './page-client';

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <MessagesSkeleton />
        </PageShell>
      }
    >
      <MessagesPageClient />
    </Suspense>
  );
}
