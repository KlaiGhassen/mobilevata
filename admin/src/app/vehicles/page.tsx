'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Eye } from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';
import { Badge } from '@/components/Badge';
import {
  useAdminVehicles,
  useDeleteVehicle,
  useUpdateVehicle,
} from '@/hooks/use-admin-api';
import { useFiltersStore } from '@/stores/filters-store';

export default function VehiclesPage() {
  const filters = useFiltersStore((s) => s.vehicles);
  const setVehicles = useFiltersStore((s) => s.setVehicles);
  const [draftQ, setDraftQ] = useState(filters.q);
  const { data, isLoading, error } = useAdminVehicles();
  const update = useUpdateVehicle();
  const remove = useDeleteVehicle();

  const onFilter = (e: FormEvent) => {
    e.preventDefault();
    setVehicles({ q: draftQ.trim(), page: 1 });
  };

  return (
    <AdminShell title="Vehicles">
      <div className="panel">
        <div className="panel__head">
          <h2>Listings moderation</h2>
        </div>
        <div className="panel__body">
          <form className="toolbar" onSubmit={onFilter}>
            <div className="field field--grow">
              <label htmlFor="q">Search</label>
              <input
                id="q"
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
                placeholder="Title, seller…"
              />
            </div>
            <div className="field">
              <label htmlFor="published">Visibility</label>
              <select
                id="published"
                value={filters.published}
                onChange={(e) =>
                  setVehicles({ published: e.target.value, page: 1 })
                }
              >
                <option value="">All</option>
                <option value="true">Published</option>
                <option value="false">Unpublished</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Filter
            </button>
          </form>
        </div>
        {isLoading ? <div className="loading">Loading vehicles…</div> : null}
        {error ? <div className="error">{(error as Error).message}</div> : null}
        {data ? (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Listing</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <Link href={`/vehicles/${v.id}`}>
                          <strong>{v.title}</strong>
                        </Link>
                        <div className="muted">
                          {[v.brandName, v.modelName, v.year, v.sellerName]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      </td>
                      <td>
                        {v.price.toLocaleString()} {v.currency || 'EUR'}
                      </td>
                      <td>
                        <Badge tone={v.published ? 'success' : 'warning'}>
                          {v.published ? 'Published' : 'Unpublished'}
                        </Badge>
                      </td>
                      <td>
                        <div className="row-actions">
                          <Link
                            href={`/vehicles/${v.id}`}
                            className="btn btn-ghost"
                          >
                            <Eye size={16} aria-hidden="true" />
                            Details
                          </Link>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() =>
                              update.mutate({
                                id: v.id,
                                body: {
                                  published: !v.published,
                                  moderationReason: v.published
                                    ? 'Unpublished by admin'
                                    : undefined,
                                },
                              })
                            }
                          >
                            {v.published ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => {
                              if (
                                !window.confirm(
                                  `Permanently delete “${v.title}”?`,
                                )
                              )
                                return;
                              remove.mutate(v.id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>
                Page {data.page} of {data.totalPages} · {data.total} vehicles
              </span>
              <div className="row-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={filters.page <= 1}
                  onClick={() => setVehicles({ page: filters.page - 1 })}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={filters.page >= data.totalPages}
                  onClick={() => setVehicles({ page: filters.page + 1 })}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AdminShell>
  );
}
