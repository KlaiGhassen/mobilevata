'use client';

import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';
import { Badge, priorityTone, statusTone } from '@/components/Badge';
import { useAdminStats, useReindex } from '@/hooks/use-admin-api';

export default function OverviewPage() {
  const { data, isLoading, error } = useAdminStats();
  const reindex = useReindex();

  return (
    <AdminShell
      title="Overview"
      actions={
        <button
          type="button"
          className="btn btn-ghost"
          disabled={reindex.isPending}
          onClick={() => reindex.mutate()}
        >
          {reindex.isPending
            ? 'Reindexing…'
            : reindex.isSuccess
              ? `Indexed ${reindex.data.indexed}`
              : 'Reindex search'}
        </button>
      }
    >
      {isLoading ? <div className="loading">Loading stats…</div> : null}
      {error ? (
        <div className="error">{(error as Error).message}</div>
      ) : null}
      {data ? (
        <>
          <section className="stats" aria-label="Key metrics">
            <article className="stat">
              <div className="stat__label">Users</div>
              <div className="stat__value">{data.users.total}</div>
              <div className="stat__meta">
                {data.users.active} active · {data.users.banned} banned
              </div>
            </article>
            <article className="stat">
              <div className="stat__label">Vehicles</div>
              <div className="stat__value">{data.vehicles.total}</div>
              <div className="stat__meta">
                {data.vehicles.published} live · {data.vehicles.unpublished}{' '}
                unpublished
              </div>
            </article>
            <article className="stat">
              <div className="stat__label">Reclamations</div>
              <div className="stat__value">{data.reclamations.pending}</div>
              <div className="stat__meta">
                pending of {data.reclamations.total} total
              </div>
            </article>
            <article className="stat">
              <div className="stat__label">Dealers</div>
              <div className="stat__value">{data.dealers.total}</div>
              <div className="stat__meta">
                {data.dealers.verified} verified
              </div>
            </article>
          </section>

          <div className="grid-2">
            <section className="panel">
              <div className="panel__head">
                <h2>Recent reclamations</h2>
                <Link href="/reclamations" className="btn btn-ghost">
                  View all
                </Link>
              </div>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentReclamations.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <Link href={`/reclamations/${r.id}`}>{r.title}</Link>
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
                          {r.targetType} · {r.reporterName || '—'}
                        </td>
                      </tr>
                    ))}
                    {!data.recentReclamations.length ? (
                      <tr>
                        <td colSpan={4} className="empty">
                          No reclamations yet
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel">
              <div className="panel__head">
                <h2>Recent users</h2>
                <Link href="/users" className="btn btn-ghost">
                  Manage
                </Link>
              </div>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <Link href={`/users/${u.id}`}>
                            {u.firstName} {u.lastName}
                          </Link>
                          <div className="muted">{u.email}</div>
                        </td>
                        <td>
                          <Badge tone="info">{u.role}</Badge>
                        </td>
                        <td>
                          <Badge tone={statusTone(u.status)}>{u.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      ) : null}
    </AdminShell>
  );
}
