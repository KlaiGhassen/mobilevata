import { PageShell } from '@/components/PageShell';
import { AccountPageSkeleton } from '@/components/LoadingBlock';

export default function AccountLoading() {
  return (
    <PageShell>
      <AccountPageSkeleton />
    </PageShell>
  );
}
