'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Eye } from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';
import { Badge, statusTone } from '@/components/Badge';
import {
  useAdminUsers,
  useCreateAdmin,
  useUpdateUser,
} from '@/hooks/use-admin-api';
import { isStaffRole, isSuperAdmin } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useFiltersStore } from '@/stores/filters-store';

export default function UsersPage() {
  const actor = useAuthStore((s) => s.user);
  const superAdmin = isSuperAdmin(actor?.role);
  const filters = useFiltersStore((s) => s.users);
  const setUsers = useFiltersStore((s) => s.setUsers);
  const [draftQ, setDraftQ] = useState(filters.q);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const { data, isLoading, error } = useAdminUsers();
  const update = useUpdateUser();
  const createAdmin = useCreateAdmin();

  const onFilter = (e: FormEvent) => {
    e.preventDefault();
    setUsers({ q: draftQ.trim(), page: 1 });
  };

  const onCreateAdmin = (e: FormEvent) => {
    e.preventDefault();
    createAdmin.mutate(
      {
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      },
      {
        onSuccess: () => {
          setEmail('');
          setPassword('');
          setFirstName('');
          setLastName('');
        },
      },
    );
  };

  const canModerate = (role: string) => {
    if (isSuperAdmin(role)) return false;
    if (isStaffRole(role) && !superAdmin) return false;
    return true;
  };

  return (
    <AdminShell title="Users">
      {superAdmin ? (
        <div className="panel">
          <div className="panel__head">
            <div>
              <h2>Add administrator</h2>
              <p className="muted" style={{ margin: '4px 0 0' }}>
                Super admins can provision new ADMIN accounts for the backoffice.
              </p>
            </div>
          </div>
          <div className="panel__body">
            <form className="toolbar" onSubmit={onCreateAdmin}>
              <div className="field">
                <label htmlFor="admin-first">First name</label>
                <input
                  id="admin-first"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  maxLength={80}
                />
              </div>
              <div className="field">
                <label htmlFor="admin-last">Last name</label>
                <input
                  id="admin-last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  maxLength={80}
                />
              </div>
              <div className="field field--grow">
                <label htmlFor="admin-email">Email</label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="field">
                <label htmlFor="admin-pass">Temp password</label>
                <input
                  id="admin-pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createAdmin.isPending}
              >
                {createAdmin.isPending ? 'Creating…' : 'Create admin'}
              </button>
            </form>
            {createAdmin.error ? (
              <div className="error">
                {(createAdmin.error as Error).message}
              </div>
            ) : null}
            {createAdmin.isSuccess ? (
              <p className="muted">Administrator created successfully.</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="panel">
        <div className="panel__head">
          <h2>Accounts</h2>
        </div>
        <div className="panel__body">
          <form className="toolbar" onSubmit={onFilter}>
            <div className="field field--grow">
              <label htmlFor="q">Search</label>
              <input
                id="q"
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
                placeholder="Name or email"
              />
            </div>
            <div className="field">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={filters.role}
                onChange={(e) => setUsers({ role: e.target.value, page: 1 })}
              >
                <option value="">All</option>
                <option value="USER">USER</option>
                <option value="DEALER">DEALER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => setUsers({ status: e.target.value, page: 1 })}
              >
                <option value="">All</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="BANNED">BANNED</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Filter
            </button>
          </form>
        </div>
        {isLoading ? <div className="loading">Loading users…</div> : null}
        {error ? <div className="error">{(error as Error).message}</div> : null}
        {data ? (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((u) => {
                    const editable = canModerate(u.role);
                    return (
                      <tr key={u.id}>
                        <td>
                          <Link href={`/users/${u.id}`}>
                            <strong>
                              {u.firstName} {u.lastName}
                            </strong>
                          </Link>
                          <div className="muted">{u.email}</div>
                        </td>
                        <td>
                          {editable ? (
                            <select
                              aria-label={`Role for ${u.email}`}
                              value={u.role}
                              disabled={update.isPending}
                              onChange={(e) =>
                                update.mutate({
                                  id: u.id,
                                  body: { role: e.target.value },
                                })
                              }
                            >
                              <option value="USER">USER</option>
                              <option value="DEALER">DEALER</option>
                              {superAdmin ? (
                                <option value="ADMIN">ADMIN</option>
                              ) : null}
                            </select>
                          ) : (
                            <Badge
                              tone={
                                u.role === 'SUPER_ADMIN' ? 'danger' : 'info'
                              }
                            >
                              {u.role}
                            </Badge>
                          )}
                        </td>
                        <td>
                          <Badge tone={statusTone(u.status)}>{u.status}</Badge>
                        </td>
                        <td>
                          <div className="row-actions">
                            <Link
                              href={`/users/${u.id}`}
                              className="btn btn-ghost"
                            >
                              <Eye size={16} aria-hidden="true" />
                              Details
                            </Link>
                            {editable ? (
                              <>
                                {u.status !== 'ACTIVE' ? (
                                  <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() =>
                                      update.mutate({
                                        id: u.id,
                                        body: { status: 'ACTIVE' },
                                      })
                                    }
                                  >
                                    Activate
                                  </button>
                                ) : null}
                                {u.status !== 'SUSPENDED' ? (
                                  <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() =>
                                      update.mutate({
                                        id: u.id,
                                        body: {
                                          status: 'SUSPENDED',
                                          moderationReason:
                                            'Suspended by admin',
                                        },
                                      })
                                    }
                                  >
                                    Suspend
                                  </button>
                                ) : null}
                                {u.status !== 'BANNED' ? (
                                  <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={() => {
                                      if (
                                        !window.confirm(
                                          `Ban ${u.email}? They will lose access immediately.`,
                                        )
                                      )
                                        return;
                                      update.mutate({
                                        id: u.id,
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
                              </>
                            ) : (
                              <span className="muted">Protected</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>
                Page {data.page} of {data.totalPages} · {data.total} users
              </span>
              <div className="row-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={filters.page <= 1}
                  onClick={() => setUsers({ page: filters.page - 1 })}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={filters.page >= data.totalPages}
                  onClick={() => setUsers({ page: filters.page + 1 })}
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
