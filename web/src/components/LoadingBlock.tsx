import { CSSProperties, ReactNode } from 'react';

type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
  'aria-hidden'?: boolean | 'true' | 'false';
};

export function Skeleton({
  className = '',
  style,
  'aria-hidden': ariaHidden = true,
}: SkeletonProps) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={style}
      aria-hidden={ariaHidden}
    />
  );
}

type BlockProps = {
  children: ReactNode;
  className?: string;
  label?: string;
};

export function SkeletonBlock({
  children,
  className = '',
  label = 'Loading',
}: BlockProps) {
  return (
    <div
      className={`skeleton-block ${className}`.trim()}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="visually-hidden">{label}</span>
      {children}
    </div>
  );
}

export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <SkeletonBlock className="loading-block">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          className="loading-block__row skeleton--block"
          style={{ height: i === 0 ? 120 : 72 }}
        />
      ))}
    </SkeletonBlock>
  );
}

export function VehicleCardSkeleton() {
  return (
    <div className="vehicle-card-skel surface">
      <Skeleton className="vehicle-card-skel__media skeleton--block" />
      <div className="vehicle-card-skel__body">
        <Skeleton className="skeleton--line" style={{ width: '70%', height: 18 }} />
        <Skeleton className="skeleton--line" style={{ width: '40%', height: 22 }} />
        <Skeleton className="skeleton--line" style={{ width: '90%', height: 14 }} />
        <div className="vehicle-card-skel__actions">
          <Skeleton className="skeleton--pill" />
          <Skeleton className="skeleton--pill" />
          <Skeleton className="skeleton--pill skeleton--pill-wide" />
        </div>
      </div>
    </div>
  );
}

export function VehicleListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonBlock className="vehicle-list-skel">
      {Array.from({ length: count }).map((_, i) => (
        <VehicleCardSkeleton key={i} />
      ))}
    </SkeletonBlock>
  );
}

export function VehicleDetailSkeleton() {
  return (
    <SkeletonBlock className="vehicle-detail-skel">
      <div className="vehicle-detail-skel__layout">
        <div className="vehicle-detail-skel__main">
          <Skeleton className="vehicle-detail-skel__gallery skeleton--block" />
          <div className="vehicle-detail-skel__content surface">
            <Skeleton className="skeleton--line" style={{ width: '65%', height: 28 }} />
            <Skeleton className="skeleton--line" style={{ width: '35%', height: 18 }} />
            <div className="vehicle-detail-skel__specs">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="skeleton--block" style={{ height: 52 }} />
              ))}
            </div>
            <Skeleton className="skeleton--block" style={{ height: 120 }} />
          </div>
        </div>
        <div className="vehicle-detail-skel__aside surface">
          <Skeleton className="skeleton--line" style={{ width: '50%', height: 20 }} />
          <Skeleton className="skeleton--block" style={{ height: 44 }} />
          <Skeleton className="skeleton--block" style={{ height: 44 }} />
          <Skeleton className="skeleton--block" style={{ height: 160 }} />
        </div>
      </div>
    </SkeletonBlock>
  );
}

export function DealerGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SkeletonBlock className="dealer-grid-skel">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="dealer-card-skel surface">
          <div className="dealer-card-skel__top">
            <Skeleton className="skeleton--avatar" />
            <div className="dealer-card-skel__text">
              <Skeleton className="skeleton--line" style={{ width: '70%', height: 18 }} />
              <Skeleton className="skeleton--line" style={{ width: '45%', height: 14 }} />
            </div>
          </div>
          <Skeleton className="skeleton--line" style={{ width: '55%', height: 14 }} />
        </div>
      ))}
    </SkeletonBlock>
  );
}

export function SearchPageSkeleton() {
  return (
    <SkeletonBlock className="search-skel">
      <div className="search-skel__filters surface">
        <Skeleton className="skeleton--block" style={{ height: 44 }} />
        <div className="search-skel__row">
          <Skeleton className="skeleton--block" style={{ height: 44 }} />
          <Skeleton className="skeleton--block" style={{ height: 44 }} />
          <Skeleton className="skeleton--block" style={{ height: 44 }} />
        </div>
        <Skeleton className="skeleton--block" style={{ height: 44, width: '40%' }} />
      </div>
      <VehicleListSkeleton count={4} />
    </SkeletonBlock>
  );
}

export function MessagesSkeleton() {
  return (
    <SkeletonBlock className="messages-skel">
      <div className="messages-skel__list surface">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="messages-skel__item">
            <Skeleton className="skeleton--avatar" />
            <div className="messages-skel__item-text">
              <Skeleton className="skeleton--line" style={{ width: '60%', height: 14 }} />
              <Skeleton className="skeleton--line" style={{ width: '85%', height: 12 }} />
            </div>
          </div>
        ))}
      </div>
      <div className="messages-skel__thread surface">
        <Skeleton className="skeleton--line" style={{ width: '40%', height: 18 }} />
        <Skeleton className="skeleton--block" style={{ height: 220, marginTop: 16 }} />
        <Skeleton className="skeleton--block" style={{ height: 48, marginTop: 16 }} />
      </div>
    </SkeletonBlock>
  );
}

export function ChatThreadSkeleton() {
  return (
    <SkeletonBlock className="chat-thread-skel">
      <div className="chat-thread-skel__header">
        <Skeleton className="skeleton--line" style={{ width: '45%', height: 18 }} />
        <Skeleton className="skeleton--line" style={{ width: '28%', height: 14 }} />
      </div>
      <div className="chat-thread-skel__bubbles">
        <Skeleton className="chat-thread-skel__bubble chat-thread-skel__bubble--in" />
        <Skeleton className="chat-thread-skel__bubble chat-thread-skel__bubble--out" />
        <Skeleton className="chat-thread-skel__bubble chat-thread-skel__bubble--in" />
        <Skeleton className="chat-thread-skel__bubble chat-thread-skel__bubble--out" />
      </div>
      <Skeleton className="skeleton--block" style={{ height: 48 }} />
    </SkeletonBlock>
  );
}

export function AuthFormSkeleton() {
  return (
    <SkeletonBlock className="auth-skel surface">
      <Skeleton className="skeleton--line" style={{ width: '40%', height: 16 }} />
      <Skeleton className="skeleton--line" style={{ width: '70%', height: 28 }} />
      <Skeleton className="skeleton--block" style={{ height: 44, marginTop: 16 }} />
      <Skeleton className="skeleton--block" style={{ height: 44 }} />
      <Skeleton className="skeleton--block" style={{ height: 48 }} />
    </SkeletonBlock>
  );
}

export function CompareBoardSkeleton() {
  return (
    <SkeletonBlock className="compare-skel">
      <div className="compare-skel__toolbar">
        <Skeleton className="skeleton--line" style={{ width: 120, height: 16 }} />
        <Skeleton className="skeleton--pill" style={{ width: 140 }} />
      </div>
      <div className="compare-skel__grid surface">
        <div className="compare-skel__label-col">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="skeleton--line" style={{ height: 18, width: '80%' }} />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, col) => (
          <div key={col} className="compare-skel__col">
            <Skeleton className="skeleton--block" style={{ height: 140 }} />
            <Skeleton className="skeleton--line" style={{ width: '90%', height: 16 }} />
            <Skeleton className="skeleton--line" style={{ width: '50%', height: 22 }} />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="skeleton--line" style={{ height: 14, width: '70%' }} />
            ))}
          </div>
        ))}
      </div>
    </SkeletonBlock>
  );
}

export function AccountPageSkeleton() {
  return (
    <SkeletonBlock className="account-skel">
      <div className="account-skel__hero surface">
        <Skeleton className="skeleton--avatar" style={{ width: 64, height: 64 }} />
        <div className="account-skel__hero-text">
          <Skeleton className="skeleton--line" style={{ width: '40%', height: 24 }} />
          <Skeleton className="skeleton--line" style={{ width: '55%', height: 14 }} />
        </div>
        <div className="account-skel__actions">
          <Skeleton className="skeleton--pill" />
          <Skeleton className="skeleton--pill" />
          <Skeleton className="skeleton--pill" />
        </div>
      </div>
      <VehicleListSkeleton count={3} />
    </SkeletonBlock>
  );
}

export function SellFormSkeleton() {
  return (
    <SkeletonBlock className="sell-skel">
      <Skeleton className="skeleton--line" style={{ width: '35%', height: 28 }} />
      <Skeleton className="skeleton--line" style={{ width: '60%', height: 16 }} />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="sell-skel__section surface">
          <Skeleton className="skeleton--line" style={{ width: '30%', height: 18 }} />
          <div className="sell-skel__row">
            <Skeleton className="skeleton--block" style={{ height: 44 }} />
            <Skeleton className="skeleton--block" style={{ height: 44 }} />
          </div>
          <Skeleton className="skeleton--block" style={{ height: 44 }} />
        </div>
      ))}
    </SkeletonBlock>
  );
}

export function HomePageSkeleton() {
  return (
    <SkeletonBlock className="home-skel">
      <div className="home-skel__hero">
        <Skeleton className="skeleton--line" style={{ width: 120, height: 20 }} />
        <Skeleton className="skeleton--line" style={{ width: '55%', height: 36 }} />
        <Skeleton className="skeleton--line" style={{ width: '40%', height: 16 }} />
        <Skeleton className="skeleton--block" style={{ height: 72, marginTop: 16, maxWidth: 640 }} />
      </div>
      <div className="home-skel__section">
        <Skeleton className="skeleton--line" style={{ width: 200, height: 24 }} />
        <div className="home-skel__tiles">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="skeleton--block" style={{ height: 96 }} />
          ))}
        </div>
      </div>
    </SkeletonBlock>
  );
}
