import { Suspense } from 'react';
import { PageShell } from '@/components/PageShell';
import { SearchPageSkeleton } from '@/components/LoadingBlock';
import DetailedSearchClient from './page-client';

export default function DetailedSearchPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <SearchPageSkeleton />
        </PageShell>
      }
    >
      <DetailedSearchClient />
    </Suspense>
  );
}
