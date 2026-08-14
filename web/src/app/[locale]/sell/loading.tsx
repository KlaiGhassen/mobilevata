import { PageShell } from '@/components/PageShell';
import { SellFormSkeleton } from '@/components/LoadingBlock';

export default function SellLoading() {
  return (
    <PageShell form>
      <SellFormSkeleton />
    </PageShell>
  );
}
