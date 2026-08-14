import { PageShell } from '@/components/PageShell';
import { AuthFormSkeleton } from '@/components/LoadingBlock';

export default function LoginLoading() {
  return (
    <PageShell narrow>
      <AuthFormSkeleton />
    </PageShell>
  );
}
