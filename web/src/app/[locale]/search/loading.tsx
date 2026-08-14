import { PageShell } from '@/components/PageShell';
import { SearchPageSkeleton } from '@/components/LoadingBlock';

export default function SearchLoading() {
  return (
    <PageShell>
      <SearchPageSkeleton />
    </PageShell>
  );
}
