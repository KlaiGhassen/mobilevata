import { PageShell } from '@/components/PageShell';
import { CompareBoardSkeleton } from '@/components/LoadingBlock';

export default function CompareLoading() {
  return (
    <PageShell>
      <CompareBoardSkeleton />
    </PageShell>
  );
}
