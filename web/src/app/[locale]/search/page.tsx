import { Suspense } from 'react';
import { PageShell } from '@/components/PageShell';
import { SearchPageSkeleton } from '@/components/LoadingBlock';
import SearchPageClient from './page-client';

export default function Page() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <SearchPageSkeleton />
        </PageShell>
      }
    >
      <SearchPageClient />
    </Suspense>
  );
}
