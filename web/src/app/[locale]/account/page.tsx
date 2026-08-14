'use client';

import {
  MessageSquare,
  PlusCircle,
  GitCompare,
  Heart,
  Pencil,
  Trash2,
  Mail,
  BadgeCheck,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AuthGate } from '@/components/AuthGate';
import { EmptyState } from '@/components/EmptyState';
import { AccountPageSkeleton } from '@/components/LoadingBlock';
import { PageShell } from '@/components/PageShell';
import { VehicleCard } from '@/components/VehicleCard';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth-context';
import { useMyVehicles } from '@/hooks/use-catalog';
import { useDeleteVehicle } from '@/hooks/use-create-vehicle';
import { confirmDialog, useUiStore } from '@/stores/ui-store';
import { useState } from 'react';

function AccountContent({ token }: { token: string }) {
  const t = useTranslations('account');
  const tn = useTranslations('nav');
  const ts = useTranslations('sell');
  const ta = useTranslations('auth');
  const tc = useTranslations('common');
  const { user, favoriteIds, compareIds } = useAuth();
  const { data: mine = [], isLoading } = useMyVehicles(token);
  const deleteVehicle = useDeleteVehicle(token);
  const pushToast = useUiStore((s) => s.pushToast);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!user) return null;

  const initials =
    `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() ||
    user.email.slice(0, 1).toUpperCase();
  const isDealer = user.role === 'DEALER';
  const roleLabel = isDealer ? ta('dealer') : ta('private');

  if (isLoading) {
    return (
      <PageShell>
        <AccountPageSkeleton />
      </PageShell>
    );
  }

  const onDelete = async (id: string, title: string) => {
    const ok = await confirmDialog({
      title: t('delete'),
      description: t('confirmDelete', { title }),
      tone: 'danger',
      confirmLabel: t('delete'),
      cancelLabel: tc('cancel'),
    });
    if (!ok) return;
    setDeletingId(id);
    try {
      await deleteVehicle.mutateAsync(id);
      pushToast(t('toastDeleted'), 'success');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Error', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PageShell className="account-page">
      <section className="account-hero surface fade-up">
        <div className="account-hero__glow" aria-hidden="true" />
        <div className="account-hero__top">
          <span className="user-avatar user-avatar--xl account-hero__avatar" aria-hidden="true">
            {initials}
          </span>
          <div className="account-hero__identity">
            <p className="account-hero__eyebrow">{t('garageLabel')}</p>
            <h1 className="account-hero__name">
              {t('hello', { name: user.firstName })}
            </h1>
            <p className="account-hero__meta">
              <span className="account-hero__email">
                <Mail size={14} aria-hidden="true" />
                {user.email}
              </span>
              <span
                className={`account-hero__role${isDealer ? ' account-hero__role--dealer' : ''}`}
              >
                <BadgeCheck size={14} aria-hidden="true" />
                {roleLabel}
              </span>
            </p>
          </div>
        </div>

        <ul className="account-hero__stats" aria-label={t('statsLabel')}>
          <li>
            <strong>{mine.length}</strong>
            <span>{t('statAds')}</span>
          </li>
          <li>
            <strong>{favoriteIds.size}</strong>
            <span>{t('statFavorites')}</span>
          </li>
          <li>
            <strong>{compareIds.length}</strong>
            <span>{t('statCompare')}</span>
          </li>
        </ul>

        <div className="account-hero__actions">
          <Link href="/sell" className="btn btn-primary">
            <PlusCircle size={16} aria-hidden="true" />
            {ts('title')}
          </Link>
          <Link href="/messages" className="btn btn-ghost">
            <MessageSquare size={16} aria-hidden="true" />
            {t('messages')}
          </Link>
          <Link href="/favorites" className="btn btn-ghost">
            <Heart size={16} aria-hidden="true" />
            {tn('favorites')}
          </Link>
          <Link href="/compare" className="btn btn-ghost">
            <GitCompare size={16} aria-hidden="true" />
            {tn('compare')}
          </Link>
        </div>
      </section>

      <section className="account-ads">
        <div className="account-ads__head">
          <div>
            <h2 className="account-ads__title">{t('myAds', { count: mine.length })}</h2>
            <p className="account-ads__lead">{t('myAdsLead')}</p>
          </div>
          {mine.length > 0 ? (
            <Link href="/sell" className="btn btn-primary account-ads__cta">
              <PlusCircle size={16} aria-hidden="true" />
              {t('placeAd')}
            </Link>
          ) : null}
        </div>

        {mine.length === 0 ? (
          <EmptyState
            title={t('noAds')}
            description={t('noAdsHint')}
            actionHref="/sell"
            actionLabel={t('placeAd')}
          />
        ) : (
          <ul className="vehicle-list account-ads__list">
            {mine.map((v, i) => (
              <li
                key={v.id}
                className="account-listing fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <VehicleCard vehicle={v} />
                <div className="account-listing__actions">
                  <Link
                    href={`/account/listings/${v.id}/edit`}
                    className="btn btn-ghost"
                  >
                    <Pencil size={16} aria-hidden="true" />
                    {t('edit')}
                  </Link>
                  <button
                    type="button"
                    className="btn btn-ghost account-listing__delete"
                    disabled={deletingId === v.id || deleteVehicle.isPending}
                    onClick={() => onDelete(v.id, v.title)}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    {deletingId === v.id ? tc('loading') : t('delete')}
                  </button>
                  <Link
                    href={`/vehicles/${v.id}`}
                    className="btn btn-primary account-listing__view"
                  >
                    {t('viewListing')}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}

export default function AccountPage() {
  const t = useTranslations('account');
  const tn = useTranslations('nav');

  return (
    <AuthGate
      title={t('title')}
      description={t('signInPrompt')}
      narrow={false}
      skeleton="account"
      guestActions={
        <Link href="/register" className="btn btn-ghost">
          {tn('register')}
        </Link>
      }
    >
      {({ token }) => <AccountContent token={token} />}
    </AuthGate>
  );
}
