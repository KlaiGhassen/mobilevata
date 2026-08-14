import { PageShell } from '@/components/PageShell';
import { VehicleListSkeleton } from '@/components/LoadingBlock';

export default function FavoritesLoading() {
  return (
    <PageShell>
      <VehicleListSkeleton count={3} />
    </PageShell>
  );
}
