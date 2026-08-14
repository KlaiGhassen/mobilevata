import { PageShell } from '@/components/PageShell';
import { AuthFormSkeleton } from '@/components/LoadingBlock';

export default function RegisterLoading() {
  return (
    <PageShell narrow>
      <AuthFormSkeleton />
    </PageShell>
  );
}
