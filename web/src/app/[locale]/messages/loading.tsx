import { PageShell } from '@/components/PageShell';
import { MessagesSkeleton } from '@/components/LoadingBlock';

export default function MessagesLoading() {
  return (
    <PageShell>
      <MessagesSkeleton />
    </PageShell>
  );
}
