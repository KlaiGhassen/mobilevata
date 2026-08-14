'use client';

import { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/EmptyState';
import {
  AccountPageSkeleton,
  AuthFormSkeleton,
  SellFormSkeleton,
  VehicleListSkeleton,
} from '@/components/LoadingBlock';
import { PageHeader, PageShell } from '@/components/PageShell';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth-context';

type SkeletonVariant = 'list' | 'account' | 'sell' | 'auth';

type Props = {
  title: string;
  description: string;
  children: (ctx: { token: string }) => ReactNode;
  narrow?: boolean;
  guestActions?: ReactNode;
  useEmptyState?: boolean;
  skeleton?: SkeletonVariant;
};

function BootSkeleton({ variant }: { variant: SkeletonVariant }) {
  switch (variant) {
    case 'account':
      return <AccountPageSkeleton />;
    case 'sell':
      return <SellFormSkeleton />;
    case 'auth':
      return <AuthFormSkeleton />;
    case 'list':
    default:
      return <VehicleListSkeleton count={3} />;
  }
}

export function AuthGate({
  title,
  description,
  children,
  narrow = true,
  guestActions,
  useEmptyState = false,
  skeleton = narrow ? 'auth' : 'list',
}: Props) {
  const ta = useTranslations('auth');
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <PageShell narrow={narrow} form={skeleton === 'sell'}>
        <BootSkeleton variant={skeleton} />
      </PageShell>
    );
  }

  if (!token) {
    if (useEmptyState) {
      return (
        <PageShell narrow={narrow}>
          <EmptyState
            title={title}
            description={description}
            actionHref="/login"
            actionLabel={ta('signIn')}
          />
          {guestActions ? <div className="auth-gate__extra">{guestActions}</div> : null}
        </PageShell>
      );
    }

    return (
      <PageShell narrow={narrow}>
        <PageHeader
          title={title}
          description={description}
          actions={
            <>
              <Link href="/login" className="btn btn-primary">
                {ta('signIn')}
              </Link>
              {guestActions}
            </>
          }
        />
      </PageShell>
    );
  }

  return <>{children({ token })}</>;
}
