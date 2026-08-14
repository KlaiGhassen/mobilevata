'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { Badge, priorityTone, statusTone } from '@/components/Badge';
import { useAdminReclamations } from '@/hooks/use-admin-api';
import { useFiltersStore } from '@/stores/filters-store';

export default function ReclamationsPage() {
  const filters = useFiltersStore((s) => s.reclamations);
  const setReclamations = useFiltersStore((s) => s.setReclamations);
  const [draftQ, setDraftQ] = useState(filters.q);
  const { data, isLoading, error } = useAdminReclamations();

  const onFilter = (e: FormEvent) => {
    e.preventDefault();
    setReclamations({ q: draftQ.trim(), page: 1 });
  };

  return (
    <AdminShell title="Reclamations">
      <div className="panel">
        <div className="panel__head">
          <h2>Reports queue</h2>
        </div>
        <div className="panel__body">
          <form className="toolbar" onSubmit={onFilter}>
            <div className="field field--grow">
              <label htmlFor="q">Search</label>
              <input
                id="q"
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
                placeholder="Title, description, target id"
              />
            </div>
            <div className="field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) =>
                  setReclamations({ status: e.target.value, page: 1 })
                }
              >
                <option value="">All</option>
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={filters.priority}
                onChange={(e) =>
                  setReclamations({ priority: e.target.value, page: 1 })
                }
              >
                <option value="">All</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Filter
            </button>
          </form>
        </div>
        {isLoading ? (
          <div className="loading">Loading reclamations…</div>
        ) : null}
        {error ? <div className="error">{(error as Error).message}</div> : null}
        {data ? (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Report</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Target</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link href={`/reclamations/${r.id}`}>
                          <strong>{r.title}</strong>
                        </Link>
                        <div className="muted">
                          {r.reporter
                            ? `${r.reporter.firstName ?? ''} ${r.reporter.lastName ?? ''}`.trim() ||
                              r.reporter.email
                            : 'Reporter'}
                        </div>
                      </td>
                      <td>
                        <Badge tone="info">{r.category}</Badge>
                      </td>
                      <td>
                        <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                      </td>
                      <td>
                        <Badge tone={priorityTone(r.priority)}>
                          {r.priority}
                        </Badge>
                      </td>
                      <td className="muted">
                        {r.targetType}
                        <div>{r.targetId}</div>
                      </td>
                    </tr>
                  ))}
                  {!data.items.length ? (
                    <tr>
                      <td colSpan={5} className="empty">
                        No reclamations match these filters
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>
                Page {data.page} of {Math.max(data.totalPages, 1)} ·{' '}
                {data.total} reports
              </span>
              <div className="row-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={filters.page <= 1}
                  onClick={() =>
                    setReclamations({ page: filters.page - 1 })
                  }
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={filters.page >= data.totalPages}
                  onClick={() =>
                    setReclamations({ page: filters.page + 1 })
                  }
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
