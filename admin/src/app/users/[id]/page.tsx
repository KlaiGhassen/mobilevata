'use client';

import Link from 'next/link';
import { use } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { Badge, statusTone } from '@/components/Badge';
import { BrandLogo } from '@/components/BrandLogo';
import {
  useAdminUser,
  useDeleteVehicle,
  useUpdateUser,
  useUpdateVehicle,
} from '@/hooks/use-admin-api';
import { isStaffRole, isSuperAdmin } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const actor = useAuthStore((s) => s.user);
  const superAdmin = isSuperAdmin(actor?.role);
  const { data, isLoading, error } = useAdminUser(id);
  const update = useUpdateUser();
  const updateVehicle = useUpdateVehicle();
  const removeVehicle = useDeleteVehicle();

  const editable = data
    ? !(isSuperAdmin(data.role) || (isStaffRole(data.role) && !superAdmin))
    : false;

  return (
    <AdminShell
      title="User details"
      actions={
        <Link href="/users" className="btn btn-ghost">
          Back to users
        </Link>
      }
    >
      {isLoading ? <div className="loading">Loading user…</div> : null}
      {error ? <div className="error">{(error as Error).message}</div> : null}

      {data ? (
        <div className="grid-2">
          <section className="panel">
            <div className="panel__head">
              <div>
                <h2>
                  {data.firstName} {data.lastName}
                </h2>
                <p className="muted" style={{ margin: '4px 0 0' }}>
                  {data.email}
                </p>
              </div>
              <div className="row-actions">
                <Badge tone="info">{data.role}</Badge>
                <Badge tone={statusTone(data.status)}>{data.status}</Badge>
              </div>
            </div>
            <div className="panel__body stack">
              <dl className="detail-grid">
                <div>
                  <dt>Phone</dt>
                  <dd>{data.phone || '—'}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>
                    {data.createdAt
                      ? new Date(data.createdAt).toLocaleString()
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>
                    {data.updatedAt
                      ? new Date(data.updatedAt).toLocaleString()
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt>Moderation note</dt>
                  <dd>{data.moderationReason || '—'}</dd>
                </div>
                <div>
                  <dt>Listings</dt>
                  <dd>
                    {data.stats.publishedVehicles} live / {data.stats.vehicles}{' '}
                    total
                  </dd>
                </div>
              </dl>

              {editable ? (
                <div className="row-actions">
                  {data.status !== 'ACTIVE' ? (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() =>
                        update.mutate({
                          id: data.id,
                          body: { status: 'ACTIVE' },
                        })
                      }
                    >
                      Activate
                    </button>
                  ) : null}
                  {data.status !== 'SUSPENDED' ? (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() =>
                        update.mutate({
                          id: data.id,
                          body: {
                            status: 'SUSPENDED',
                            moderationReason: 'Suspended by admin',
                          },
                        })
                      }
                    >
                      Suspend
                    </button>
                  ) : null}
                  {data.status !== 'BANNED' ? (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => {
                        if (
                          !window.confirm(
                            `Ban ${data.email}? They will lose access immediately.`,
                          )
                        )
                          return;
                        update.mutate({
                          id: data.id,
                          body: {
                            status: 'BANNED',
                            moderationReason: 'Banned by admin',
                          },
                        });
                      }}
                    >
                      Ban
                    </button>
                  ) : null}
                </div>
              ) : (
                <p className="muted">
                  This account is protected from moderation.
                </p>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel__head">
              <h2>Dealer profile</h2>
            </div>
            <div className="panel__body">
              {data.dealer ? (
                <dl className="detail-grid">
                  <div>
                    <dt>Name</dt>
                    <dd>{data.dealer.name}</dd>
                  </div>
                  <div>
                    <dt>Verified</dt>
                    <dd>
                      <Badge
                        tone={data.dealer.verified ? 'success' : 'warning'}
                      >
                        {data.dealer.verified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd>
                      {[data.dealer.city, data.dealer.country]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>{data.dealer.phone || '—'}</dd>
                  </div>
                  <div>
                    <dt>Website</dt>
                    <dd>{data.dealer.website || '—'}</dd>
                  </div>
                  <div>
                    <dt>Rating</dt>
                    <dd>{data.dealer.rating ?? '—'}</dd>
                  </div>
                </dl>
              ) : (
                <p className="muted">No dealer profile linked.</p>
              )}
            </div>
          </section>

          <section className="panel" style={{ gridColumn: '1 / -1' }}>
            <div className="panel__head">
              <h2>Recent listings</h2>
            </div>
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
                  {data.recentVehicles.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <Link href={`/vehicles/${v.id}`}>
                          <strong>{v.title}</strong>
                        </Link>
                        <div className="muted">
                          {[v.brandName, v.modelName, v.year]
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
                            Details
                          </Link>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() =>
                              updateVehicle.mutate({
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
                              removeVehicle.mutate(v.id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!data.recentVehicles.length ? (
                    <tr>
                      <td colSpan={4} className="empty">
                        No listings for this user
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}
    </AdminShell>
  );
}
