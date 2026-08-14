import { PageShell } from '@/components/PageShell';
import { DealerGridSkeleton } from '@/components/LoadingBlock';

export default function DealersLoading() {
  return (
    <PageShell>
      <DealerGridSkeleton />
    </PageShell>
  );
}
