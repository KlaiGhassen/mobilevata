'use client';

import { FormEvent, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { Badge, statusTone } from '@/components/Badge';
import {
  useAdminDealers,
  useDeleteDealer,
  useUpdateDealer,
} from '@/hooks/use-admin-api';
import { useFiltersStore } from '@/stores/filters-store';

export default function DealersPage() {
  const filters = useFiltersStore((s) => s.dealers);
  const setDealers = useFiltersStore((s) => s.setDealers);
  const [draftQ, setDraftQ] = useState(filters.q);
  const { data, isLoading, error } = useAdminDealers();
  const update = useUpdateDealer();
  const remove = useDeleteDealer();

  const onFilter = (e: FormEvent) => {
    e.preventDefault();
    setDealers({ q: draftQ.trim(), page: 1 });
  };

  return (
    <AdminShell title="Dealers">
      <div className="panel">
        <div className="panel__head">
          <h2>Dealer directory</h2>
        </div>
        <div className="panel__body">
          <form className="toolbar" onSubmit={onFilter}>
            <div className="field field--grow">
              <label htmlFor="q">Search</label>
              <input
                id="q"
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
                placeholder="Name or city"
              />
            </div>
            <div className="field">
              <label htmlFor="verified">Verified</label>
              <select
                id="verified"
                value={filters.verified}
                onChange={(e) =>
                  setDealers({ verified: e.target.value, page: 1 })
                }
              >
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Unverified</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Filter
            </button>
          </form>
        </div>
        {isLoading ? <div className="loading">Loading dealers…</div> : null}
        {error ? <div className="error">{(error as Error).message}</div> : null}
        {data ? (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Dealer</th>
                    <th>Owner</th>
                    <th>Verified</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <strong>{d.name}</strong>
                        <div className="muted">
                          {[d.city, d.country].filter(Boolean).join(', ')}
                        </div>
                      </td>
                      <td>
                        {d.ownerName || '—'}
                        <div className="muted">{d.ownerEmail}</div>
                        {d.ownerStatus ? (
                          <Badge tone={statusTone(d.ownerStatus)}>
                            {d.ownerStatus}
                          </Badge>
                        ) : null}
                      </td>
                      <td>
                        <Badge tone={d.verified ? 'success' : 'warning'}>
                          {d.verified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() =>
                              update.mutate({
                                id: d.id,
                                body: { verified: !d.verified },
                              })
                            }
                          >
                            {d.verified ? 'Unverify' : 'Verify'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => {
                              if (
                                !window.confirm(
                                  `Delete dealer “${d.name}”? Owner becomes USER.`,
                                )
                              )
                                return;
                              remove.mutate(d.id);
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
                Page {data.page} of {data.totalPages} · {data.total} dealers
              </span>
              <div className="row-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={filters.page <= 1}
                  onClick={() => setDealers({ page: filters.page - 1 })}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={filters.page >= data.totalPages}
                  onClick={() => setDealers({ page: filters.page + 1 })}
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
