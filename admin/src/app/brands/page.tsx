'use client';

import { FormEvent, useState } from 'react';
import { Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';
import { Badge } from '@/components/Badge';
import { BrandFormDialog } from '@/components/BrandFormDialog';
import { BrandLogo } from '@/components/BrandLogo';
import {
  useAdminBrands,
  useCreateBrand,
  useDeleteBrand,
  useUpdateBrand,
} from '@/hooks/use-admin-api';
import type { AdminBrand } from '@/lib/api';
import { useFiltersStore } from '@/stores/filters-store';

type DialogState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; brand: AdminBrand };

export default function BrandsPage() {
  const filters = useFiltersStore((s) => s.brands);
  const setBrands = useFiltersStore((s) => s.setBrands);
  const [draftQ, setDraftQ] = useState(filters.q);
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });

  const { data, isLoading, error, isFetching } = useAdminBrands();
  const create = useCreateBrand();
  const update = useUpdateBrand();
  const remove = useDeleteBrand();

  const onFilter = (e: FormEvent) => {
    e.preventDefault();
    setBrands({ q: draftQ.trim(), page: 1 });
  };

  const dialogOpen = dialog.mode !== 'closed';
  const dialogError =
    dialog.mode === 'create'
      ? create.error
        ? (create.error as Error).message
        : null
      : dialog.mode === 'edit'
        ? update.error
          ? (update.error as Error).message
          : null
        : null;

  return (
    <AdminShell
      title="Brands"
      actions={
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setDialog({ mode: 'create' })}
        >
          <Plus size={16} aria-hidden="true" />
          Add brand
        </button>
      }
    >
      <div className="panel">
        <div className="panel__head">
          <div>
            <h2>Catalog brands</h2>
            <p className="muted" style={{ margin: '4px 0 0' }}>
              Manage logos, popularity, and catalog coverage.
            </p>
          </div>
          {data ? (
            <span className="muted">
              {data.total} brands
              {isFetching ? ' · refreshing…' : ''}
            </span>
          ) : null}
        </div>

        <div className="panel__body">
          <form className="toolbar" onSubmit={onFilter}>
            <div className="field field--grow">
              <label htmlFor="brand-q">Search</label>
              <input
                id="brand-q"
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
                placeholder="Brand name"
              />
            </div>
            <div className="field">
              <label htmlFor="brand-popular">Visibility</label>
              <select
                id="brand-popular"
                value={filters.popular}
                onChange={(e) =>
                  setBrands({ popular: e.target.value, page: 1 })
                }
              >
                <option value="">All</option>
                <option value="true">Popular</option>
                <option value="false">Standard</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="brand-sort">Sort</label>
              <select
                id="brand-sort"
                value={filters.sort}
                onChange={(e) => setBrands({ sort: e.target.value, page: 1 })}
              >
                <option value="name">Name A–Z</option>
                <option value="popular">Popular first</option>
                <option value="newest">Newest</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Filter
            </button>
          </form>
        </div>

        {isLoading ? <div className="loading">Loading brands…</div> : null}
        {error ? <div className="error">{(error as Error).message}</div> : null}

        {data ? (
          <>
            <div className="brand-grid">
              {data.items.map((b) => (
                <article key={b.id} className="brand-card">
                  <div className="brand-card__media">
                    <BrandLogo name={b.name} logoUrl={b.logoUrl} size={72} />
                    {b.popular ? (
                      <span className="brand-card__star" title="Popular">
                        <Star size={14} fill="currentColor" aria-hidden="true" />
                      </span>
                    ) : null}
                  </div>
                  <div className="brand-card__body">
                    <h3>{b.name}</h3>
                    <div className="brand-card__meta">
                      <Badge tone={b.popular ? 'info' : 'neutral'}>
                        {b.popular ? 'Popular' : 'Standard'}
                      </Badge>
                      <span className="muted">
                        {b._count?.models ?? 0} models
                      </span>
                    </div>
                  </div>
                  <div className="brand-card__actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setDialog({ mode: 'edit', brand: b })}
                    >
                      <Pencil size={16} aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() =>
                        update.mutate({
                          id: b.id,
                          body: { popular: !b.popular },
                        })
                      }
                    >
                      {b.popular ? 'Unmark' : 'Popular'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={(b._count?.models ?? 0) > 0}
                      title={
                        (b._count?.models ?? 0) > 0
                          ? 'Remove models first'
                          : 'Delete brand'
                      }
                      onClick={() => {
                        if (!window.confirm(`Delete brand “${b.name}”?`))
                          return;
                        remove.mutate(b.id);
                      }}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
              {!data.items.length ? (
                <p className="empty brand-grid__empty">
                  No brands match these filters
                </p>
              ) : null}
            </div>

            <div className="pagination">
              <span>
                Page {data.page} of {Math.max(data.totalPages, 1)} ·{' '}
                {data.total} brands
              </span>
              <div className="row-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={filters.page <= 1}
                  onClick={() => setBrands({ page: filters.page - 1 })}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={filters.page >= data.totalPages}
                  onClick={() => setBrands({ page: filters.page + 1 })}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <BrandFormDialog
        open={dialogOpen}
        mode={dialog.mode === 'edit' ? 'edit' : 'create'}
        brand={dialog.mode === 'edit' ? dialog.brand : null}
        saving={
          dialog.mode === 'create' ? create.isPending : update.isPending
        }
        error={dialogError}
        onClose={() => {
          create.reset();
          update.reset();
          setDialog({ mode: 'closed' });
        }}
        onSubmit={async (values) => {
          if (dialog.mode === 'create') {
            await create.mutateAsync({
              name: values.name,
              popular: values.popular,
              logoUrl: values.logoUrl || undefined,
            });
            setDialog({ mode: 'closed' });
            return;
          }
          if (dialog.mode === 'edit') {
            await update.mutateAsync({
              id: dialog.brand.id,
              body: {
                name: values.name,
                popular: values.popular,
                logoUrl: values.logoUrl,
              },
            });
            setDialog({ mode: 'closed' });
          }
        }}
      />
    </AdminShell>
  );
}
