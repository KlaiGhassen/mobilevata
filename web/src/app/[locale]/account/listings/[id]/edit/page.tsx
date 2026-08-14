'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import { AuthGate } from '@/components/AuthGate';
import { EmptyState } from '@/components/EmptyState';
import { SellFormSkeleton } from '@/components/LoadingBlock';
import {
  VehicleListingForm,
  vehicleToForm,
} from '@/components/VehicleListingForm';
import { PageShell } from '@/components/PageShell';
import { useMyVehicles } from '@/hooks/use-catalog';
import { useUpdateVehicle } from '@/hooks/use-create-vehicle';
import { useRouter } from '@/i18n/navigation';
import { useMemo } from 'react';

function EditListingContent({
  token,
  id,
}: {
  token: string;
  id: string;
}) {
  const t = useTranslations('sell');
  const tc = useTranslations('common');
  const router = useRouter();
  const { data: mine = [], isLoading } = useMyVehicles(token);
  const updateVehicle = useUpdateVehicle(token);

  const vehicle = useMemo(
    () => mine.find((v) => v.id === id),
    [mine, id],
  );

  if (isLoading) {
    return (
      <PageShell form>
        <SellFormSkeleton />
      </PageShell>
    );
  }

  if (!vehicle) {
    return (
      <PageShell>
        <EmptyState
          title={t('editNotFound')}
          actionHref="/account"
          actionLabel={tc('backHome')}
        />
      </PageShell>
    );
  }

  return (
    <VehicleListingForm
      token={token}
      mode="edit"
      initial={vehicleToForm(vehicle)}
      submitting={updateVehicle.isPending}
      onSubmit={async (payload) => {
        const updated = await updateVehicle.mutateAsync({
          id,
          data: payload,
        });
        router.push(`/vehicles/${updated.id}`);
      }}
    />
  );
}

export default function EditListingPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const t = useTranslations('sell');
  const { id } = use(params);

  return (
    <AuthGate
      title={t('editTitle')}
      description={t('needLogin')}
      useEmptyState
      narrow={false}
      skeleton="sell"
    >
      {({ token }) => <EditListingContent token={token} id={id} />}
    </AuthGate>
  );
}
