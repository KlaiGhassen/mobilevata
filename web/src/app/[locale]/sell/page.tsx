'use client';

import { AuthGate } from '@/components/AuthGate';
import { VehicleListingForm } from '@/components/VehicleListingForm';
import { useCreateVehicle } from '@/hooks/use-create-vehicle';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

function SellForm({ token }: { token: string }) {
  const router = useRouter();
  const createVehicle = useCreateVehicle(token);

  return (
    <VehicleListingForm
      token={token}
      mode="create"
      submitting={createVehicle.isPending}
      onSubmit={async (payload) => {
        const vehicle = await createVehicle.mutateAsync(payload);
        router.push(`/vehicles/${vehicle.id}`);
      }}
    />
  );
}

export default function SellPage() {
  const t = useTranslations('sell');

  return (
    <AuthGate
      title={t('title')}
      description={t('needLogin')}
      useEmptyState
      narrow={false}
      skeleton="sell"
    >
      {({ token }) => <SellForm token={token} />}
    </AuthGate>
  );
}
