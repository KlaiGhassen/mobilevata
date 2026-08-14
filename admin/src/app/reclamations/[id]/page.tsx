'use client';

import Link from 'next/link';
import { FormEvent, use, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { Badge, priorityTone, statusTone } from '@/components/Badge';
import {
  useAdminReclamation,
  useUpdateReclamation,
} from '@/hooks/use-admin-api';

const ACTIONS = [
  'NONE',
  'WARNING',
  'UNPUBLISH_VEHICLE',
  'DELETE_VEHICLE',
  'SUSPEND_USER',
  'BAN_USER',
  'DELETE_USER',
  'DELETE_DEALER',
] as const;

export default function ReclamationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, error } = useAdminReclamation(id);
  const update = useUpdateReclamation(id);

  const [status, setStatus] = useState('OPEN');
  const [priority, setPriority] = useState('MEDIUM');
  const [moderationAction, setModerationAction] = useState('NONE');
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    if (!data) return;
    setStatus(data.status);
    setPriority(data.priority);
    setModerationAction(data.moderationAction || 'NONE');
    setResolutionNote(data.resolutionNote || '');
    setResolution(data.resolution || '');
  }, [data]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    update.mutate({
      status,
      priority,
      moderationAction,
      resolutionNote: resolutionNote || undefined,
      resolution: resolution || undefined,
    });
  };

  return (
    <AdminShell
      title="Treat reclamation"
      actions={
        <Link href="/reclamations" className="btn btn-ghost">
          Back to queue
        </Link>
      }
    >
      {isLoading ? <div className="loading">Loading report…</div> : null}
      {error ? <div className="error">{(error as Error).message}</div> : null}
      {data ? (
        <div className="grid-2">
          <section className="panel">
            <div className="panel__head">
              <h2>{data.title}</h2>
              <div className="row-actions">
                <Badge tone={statusTone(data.status)}>{data.status}</Badge>
                <Badge tone={priorityTone(data.priority)}>{data.priority}</Badge>
              </div>
            </div>
            <div className="panel__body stack">
              <p style={{ margin: 0 }}>{data.description}</p>
              <dl className="detail-grid">
                <div>
                  <dt>Category</dt>
                  <dd>{data.category}</dd>
                </div>
                <div>
                  <dt>Target</dt>
                  <dd>
                    {data.targetType} · {data.targetId}
                  </dd>
                </div>
                <div>
                  <dt>Reporter</dt>
                  <dd>
                    {data.reporter
                      ? `${data.reporter.firstName ?? ''} ${data.reporter.lastName ?? ''}`.trim() ||
                        data.reporter.email
                      : data.reporterId}
                  </dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>
                    {data.createdAt
                      ? new Date(data.createdAt).toLocaleString()
                      : '—'}
                  </dd>
                </div>
              </dl>

              {data.target && !('missing' in data.target) ? (
                <div className="panel" style={{ borderRadius: 'var(--radius-md)' }}>
                  <div className="panel__head">
                    <h2>Target snapshot</h2>
                  </div>
                  <div className="panel__body">
                    <pre
                      style={{
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        fontSize: 'var(--text-sm)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {JSON.stringify(data.target, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="muted">Target snapshot unavailable or deleted.</p>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel__head">
              <h2>Moderation</h2>
            </div>
            <div className="panel__body">
              <form className="stack" onSubmit={onSubmit}>
                <div className="field">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
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
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="action">Moderation action</label>
                  <select
                    id="action"
                    value={moderationAction}
                    onChange={(e) => setModerationAction(e.target.value)}
                  >
                    {ACTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="note">Internal note</label>
                  <textarea
                    id="note"
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    maxLength={5000}
                  />
                </div>
                <div className="field">
                  <label htmlFor="resolution">Public resolution</label>
                  <textarea
                    id="resolution"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    maxLength={5000}
                  />
                </div>
                {update.error ? (
                  <div className="alert" role="alert">
                    {(update.error as Error).message}
                  </div>
                ) : null}
                {update.isSuccess ? (
                  <p className="muted">
                    Saved. Side effects apply when action is not NONE.
                  </p>
                ) : null}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={update.isPending}
                >
                  {update.isPending ? 'Saving…' : 'Apply treatment'}
                </button>
              </form>
            </div>
          </section>
        </div>
      ) : null}
    </AdminShell>
  );
}
