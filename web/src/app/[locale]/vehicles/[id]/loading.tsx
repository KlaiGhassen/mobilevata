import { PageShell } from '@/components/PageShell';
import { VehicleDetailSkeleton } from '@/components/LoadingBlock';

export default function VehicleLoading() {
  return (
    <PageShell>
      <VehicleDetailSkeleton />
    </PageShell>
  );
}
