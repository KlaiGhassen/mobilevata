'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { Badge, statusTone } from '@/components/Badge';
import { BrandLogo } from '@/components/BrandLogo';
import {
  useAdminVehicle,
  useDeleteVehicle,
  useUpdateVehicle,
} from '@/hooks/use-admin-api';

export default function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, error } = useAdminVehicle(id);
  const update = useUpdateVehicle();
  const remove = useDeleteVehicle();
  const [active, setActive] = useState(0);

  const images = data?.images ?? [];
  const hero = images[active] || images[0] || null;

  return (
    <AdminShell
      title="Vehicle details"
      actions={
        <Link href="/vehicles" className="btn btn-ghost">
          Back to vehicles
        </Link>
      }
    >
      {isLoading ? <div className="loading">Loading vehicle…</div> : null}
      {error ? <div className="error">{(error as Error).message}</div> : null}

      {data ? (
        <div className="grid-2">
          <section className="panel">
            <div className="panel__head">
              <div>
                <h2>{data.title}</h2>
                <p className="muted" style={{ margin: '4px 0 0' }}>
                  {[data.brand?.name, data.model?.name, data.year]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <div className="row-actions">
                <Badge tone={data.published ? 'success' : 'warning'}>
                  {data.published ? 'Published' : 'Unpublished'}
                </Badge>
                <Badge tone="info">{data.sellersType || '—'}</Badge>
              </div>
            </div>
            <div className="panel__body stack">
              <div className="detail-gallery">
                <div className="detail-gallery__hero">
                  {hero ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={hero} alt={data.title} />
                  ) : (
                    <div className="detail-gallery__empty">No photos</div>
                  )}
                </div>
                {images.length > 1 ? (
                  <div className="detail-gallery__thumbs">
                    {images.map((src, i) => (
                      <button
                        key={`${src}-${i}`}
                        type="button"
                        className={`detail-gallery__thumb${i === active ? ' is-active' : ''}`}
                        onClick={() => setActive(i)}
                        aria-label={`Photo ${i + 1}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {data.description || 'No description provided.'}
              </p>

              <div className="row-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    update.mutate({
                      id: data.id,
                      body: {
                        published: !data.published,
                        moderationReason: data.published
                          ? 'Unpublished by admin'
                          : undefined,
                      },
                    })
                  }
                >
                  {data.published ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    if (
                      !window.confirm(
                        `Permanently delete “${data.title}”?`,
                      )
                    )
                      return;
                    remove.mutate(data.id, {
                      onSuccess: () => router.replace('/vehicles'),
                    });
                  }}
                >
                  Delete listing
                </button>
              </div>
            </div>
          </section>

          <div className="stack">
            <section className="panel">
              <div className="panel__head">
                <h2>Specs</h2>
                {data.brand ? (
                  <BrandLogo
                    name={data.brand.name || 'Brand'}
                    logoUrl={data.brand.logoUrl}
                    size={40}
                  />
                ) : null}
              </div>
              <div className="panel__body">
                <dl className="detail-grid">
                  <div>
                    <dt>Price</dt>
                    <dd>
                      {data.price.toLocaleString()} {data.currency || 'EUR'}
                    </dd>
                  </div>
                  <div>
                    <dt>Mileage</dt>
                    <dd>{data.mileage.toLocaleString()} km</dd>
                  </div>
                  <div>
                    <dt>Fuel</dt>
                    <dd>{data.fuelType || '—'}</dd>
                  </div>
                  <div>
                    <dt>Transmission</dt>
                    <dd>{data.transmission || '—'}</dd>
                  </div>
                  <div>
                    <dt>Body</dt>
                    <dd>{data.bodyType || '—'}</dd>
                  </div>
                  <div>
                    <dt>Condition</dt>
                    <dd>{data.condition || '—'}</dd>
                  </div>
                  <div>
                    <dt>Power</dt>
                    <dd>
                      {data.powerHp
                        ? `${data.powerHp} hp`
                        : data.powerKw
                          ? `${data.powerKw} kW`
                          : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt>Doors / seats</dt>
                    <dd>
                      {data.doors ?? '—'} / {data.seats ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt>Color</dt>
                    <dd>{data.color || '—'}</dd>
                  </div>
                  <div>
                    <dt>Interior</dt>
                    <dd>{data.interiorColor || '—'}</dd>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd>
                      {[data.city, data.postalCode, data.country]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt>Views</dt>
                    <dd>{data.views}</dd>
                  </div>
                  <div>
                    <dt>Service book</dt>
                    <dd>{data.hasServiceBook ? 'Yes' : 'No'}</dd>
                  </div>
                  <div>
                    <dt>Warranty</dt>
                    <dd>{data.hasWarranty ? 'Yes' : 'No'}</dd>
                  </div>
                  <div>
                    <dt>Accident-free</dt>
                    <dd>{data.accidentFree ? 'Yes' : 'No'}</dd>
                  </div>
                  <div>
                    <dt>VAT deductible</dt>
                    <dd>{data.vatDeductible ? 'Yes' : 'No'}</dd>
                  </div>
                  <div>
                    <dt>Moderation</dt>
                    <dd>{data.moderationReason || '—'}</dd>
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
              </div>
            </section>

            <section className="panel">
              <div className="panel__head">
                <h2>Seller</h2>
              </div>
              <div className="panel__body stack">
                {data.seller ? (
                  <>
                    <dl className="detail-grid">
                      <div>
                        <dt>Name</dt>
                        <dd>
                          <Link href={`/users/${data.seller.id}`}>
                            {data.seller.firstName} {data.seller.lastName}
                          </Link>
                        </dd>
                      </div>
                      <div>
                        <dt>Email</dt>
                        <dd>{data.seller.email || '—'}</dd>
                      </div>
                      <div>
                        <dt>Phone</dt>
                        <dd>{data.seller.phone || '—'}</dd>
                      </div>
                      <div>
                        <dt>Role / status</dt>
                        <dd>
                          <div className="row-actions">
                            <Badge tone="info">
                              {data.seller.role || '—'}
                            </Badge>
                            {data.seller.status ? (
                              <Badge tone={statusTone(data.seller.status)}>
                                {data.seller.status}
                              </Badge>
                            ) : null}
                          </div>
                        </dd>
                      </div>
                    </dl>
                    <Link
                      href={`/users/${data.seller.id}`}
                      className="btn btn-ghost"
                    >
                      Open user details
                    </Link>
                  </>
                ) : (
                  <p className="muted">Seller unavailable.</p>
                )}

                {data.dealer ? (
                  <dl className="detail-grid">
                    <div>
                      <dt>Dealer</dt>
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
                  </dl>
                ) : null}
              </div>
            </section>

            {data.features.length ? (
              <section className="panel">
                <div className="panel__head">
                  <h2>Features</h2>
                </div>
                <div className="panel__body">
                  <ul className="feature-list">
                    {data.features.map((f) => (
                      <li key={f}>{f.replace(/_/g, ' ')}</li>
                    ))}
                  </ul>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
