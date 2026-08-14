'use client';

import { FormEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Check,
  Lock,
  MessageSquare,
  Send,
  X,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Alert } from '@/components/Alert';
import { EmptyState } from '@/components/EmptyState';
import { MessagesSkeleton, ChatThreadSkeleton } from '@/components/LoadingBlock';
import { PageHeader, PageShell } from '@/components/PageShell';
import {
  formatPrice,
  type ChatMessage,
  type Conversation,
  type ConversationStatus,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { getChatSocket } from '@/lib/socket';
import { queryKeys } from '@/lib/query-keys';
import {
  useAcceptConversation,
  useChatMessages,
  useConversation,
  useConversations,
  useDeclineConversation,
  useSendChatMessage,
} from '@/hooks/use-chat';
import { Link } from '@/i18n/navigation';
import { useQueryClient } from '@tanstack/react-query';

function partyName(
  party?: { firstName?: string; lastName?: string } | null,
  fallback = '—',
) {
  const name = `${party?.firstName ?? ''} ${party?.lastName ?? ''}`.trim();
  return name || fallback;
}

function statusTone(status: ConversationStatus) {
  if (status === 'OPEN') return 'success';
  if (status === 'DECLINED') return 'error';
  return 'info';
}

export default function MessagesPageClient() {
  const t = useTranslations('chat');
  const tc = useTranslations('common');
  const tAuth = useTranslations('auth');
  const locale = useLocale();
  const { token, user, loading } = useAuth();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('c');
  const qc = useQueryClient();

  const { data: conversations = [], isLoading: listLoading } =
    useConversations(token);
  const { data: conversation, isLoading: detailLoading } = useConversation(
    token,
    selectedId,
  );
  const { data: messages = [], isLoading: messagesLoading } = useChatMessages(
    token,
    selectedId && conversation?.status === 'OPEN' ? selectedId : null,
  );

  const acceptMutation = useAcceptConversation(token);
  const declineMutation = useDeclineConversation(token);
  const sendMutation = useSendChatMessage(token);

  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const inputId = useId();
  const bottomRef = useRef<HTMLDivElement>(null);

  const isSeller = Boolean(
    user && conversation && conversation.sellerId === user.id,
  );

  const counterpart = useMemo(() => {
    if (!conversation || !user) return null;
    return conversation.buyerId === user.id
      ? conversation.seller
      : conversation.buyer;
  }, [conversation, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selectedId]);

  useEffect(() => {
    if (!token || !selectedId || conversation?.status !== 'OPEN') return;

    const socket = getChatSocket(token);
    socket.emit('conversation:join', { conversationId: selectedId });

    const onNew = (payload: {
      conversationId: string;
      message: ChatMessage;
    }) => {
      if (payload.conversationId !== selectedId) return;
      qc.setQueryData<ChatMessage[]>(
        queryKeys.chatMessages(selectedId),
        (old = []) =>
          old.some((m) => m.id === payload.message.id)
            ? old
            : [...old, payload.message],
      );
      qc.invalidateQueries({ queryKey: queryKeys.conversations() });
    };

    const onUpdated = (updated: Conversation) => {
      qc.setQueryData(queryKeys.conversation(updated.id), updated);
      qc.invalidateQueries({ queryKey: queryKeys.conversations() });
    };

    socket.on('message:new', onNew);
    socket.on('conversation:updated', onUpdated);

    return () => {
      socket.off('message:new', onNew);
      socket.off('conversation:updated', onUpdated);
      socket.emit('conversation:leave', { conversationId: selectedId });
    };
  }, [token, selectedId, conversation?.status, qc]);

  useEffect(() => {
    if (!token) return;
    const socket = getChatSocket(token);
    const onUpdated = (updated: Conversation) => {
      qc.setQueryData(queryKeys.conversation(updated.id), updated);
      qc.setQueryData<Conversation[]>(queryKeys.conversations(), (old = []) => {
        const idx = old.findIndex((c) => c.id === updated.id);
        if (idx === -1) return [updated, ...old];
        const next = [...old];
        next[idx] = { ...next[idx], ...updated };
        return next;
      });
    };
    socket.on('conversation:updated', onUpdated);
    return () => {
      socket.off('conversation:updated', onUpdated);
    };
  }, [token, qc]);

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token || !selectedId || !draft.trim()) return;
    const content = draft.trim();
    setDraft('');
    try {
      const socket = getChatSocket(token);
      if (socket.connected) {
        socket.emit(
          'message:send',
          { conversationId: selectedId, content },
          (ack?: { ok?: boolean; message?: ChatMessage; error?: string }) => {
            if (ack && ack.ok === false) {
              setError(ack.error || 'Error');
              setDraft(content);
            }
          },
        );
      } else {
        await sendMutation.mutateAsync({ conversationId: selectedId, content });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      setDraft(content);
    }
  };

  const statusLabel = (status: ConversationStatus) => {
    switch (status) {
      case 'PENDING':
        return t('pending');
      case 'OPEN':
        return t('open');
      case 'DECLINED':
        return t('declined');
      case 'CLOSED':
        return t('closed');
      default:
        return status;
    }
  };

  if (loading || (token && listLoading)) {
    return (
      <PageShell>
        <PageHeader title={t('title')} />
        <MessagesSkeleton />
      </PageShell>
    );
  }

  if (!token) {
    return (
      <PageShell narrow>
        <PageHeader
          title={t('title')}
          description={t('needLogin')}
          actions={
            <Link href="/login" className="btn btn-primary">
              {tAuth('signIn')}
            </Link>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell className="messages-page">
      <PageHeader title={t('title')} description={t('subtitle')} />

      {conversations.length === 0 ? (
        <EmptyState
          title={t('empty')}
          description={t('emptyHint')}
          actionHref="/search"
          actionLabel={tc('browseOffers')}
        />
      ) : (
        <div className="messages-layout">
          <aside className="messages-list surface" aria-label={t('title')}>
            <ul className="messages-list__items">
              {conversations.map((c) => {
                const active = c.id === selectedId;
                const other =
                  c.buyerId === user?.id ? c.seller : c.buyer;
                return (
                  <li key={c.id}>
                    <Link
                      href={`/messages?c=${c.id}`}
                      className={`messages-list__item${active ? ' is-active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                    >
                      <div className="messages-list__thumb" aria-hidden="true">
                        {c.vehicle?.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.vehicle.images[0]} alt="" />
                        ) : (
                          <MessageSquare size={18} />
                        )}
                      </div>
                      <div className="messages-list__meta">
                        <span className="messages-list__title">
                          {c.vehicle?.title || t('conversation')}
                        </span>
                        <span className="messages-list__sub">
                          {partyName(other)} · {statusLabel(c.status)}
                        </span>
                        {c.lastMessagePreview ? (
                          <span className="messages-list__preview">
                            {c.lastMessagePreview}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="messages-detail surface" aria-live="polite">
            {!selectedId ? (
              <EmptyState
                illustration={false}
                icon={<MessageSquare size={28} />}
                title={t('emptySelect')}
                description={t('emptySelectDesc')}
              />
            ) : detailLoading || !conversation ? (
              <ChatThreadSkeleton />
            ) : (
              <>
                <header className="messages-detail__header">
                  <div>
                    <h2 className="messages-detail__title">
                      {conversation.vehicle?.title || t('conversation')}
                    </h2>
                    <p className="messages-detail__sub">
                      {partyName(counterpart)}
                      {conversation.vehicle?.price != null
                        ? ` · ${formatPrice(conversation.vehicle.price, locale)}`
                        : ''}
                    </p>
                  </div>
                  <span
                    className={`badge messages-detail__status messages-detail__status--${statusTone(conversation.status)}`}
                  >
                    {statusLabel(conversation.status)}
                  </span>
                </header>

                <div className="messages-detail__offer">
                  <p className="messages-detail__offer-label">{t('offer')}</p>
                  <p className="messages-detail__offer-text">
                    {conversation.offerMessage}
                  </p>
                  {conversation.offerPrice != null ? (
                    <p className="messages-detail__offer-price">
                      {t('offerPrice')}:{' '}
                      {formatPrice(conversation.offerPrice, locale)}
                    </p>
                  ) : null}
                  {conversation.phone && isSeller ? (
                    <p className="messages-detail__offer-phone">
                      {t('phone')}: {conversation.phone}
                    </p>
                  ) : null}
                  {conversation.vehicleId ? (
                    <Link
                      href={`/vehicles/${conversation.vehicleId}`}
                      className="btn btn-ghost messages-detail__vehicle-link"
                    >
                      {t('viewVehicle')}
                    </Link>
                  ) : null}
                </div>

                {conversation.status === 'PENDING' && isSeller ? (
                  <div className="messages-detail__actions">
                    <Alert tone="info">{t('lockedSeller')}</Alert>
                    <div className="messages-detail__action-row">
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={acceptMutation.isPending}
                        onClick={() =>
                          acceptMutation.mutate(conversation.id, {
                            onError: (err) =>
                              setError(
                                err instanceof Error ? err.message : 'Error',
                              ),
                          })
                        }
                      >
                        <Check size={16} aria-hidden="true" />
                        {t('accept')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        disabled={declineMutation.isPending}
                        onClick={() =>
                          declineMutation.mutate(conversation.id, {
                            onError: (err) =>
                              setError(
                                err instanceof Error ? err.message : 'Error',
                              ),
                          })
                        }
                      >
                        <X size={16} aria-hidden="true" />
                        {t('decline')}
                      </button>
                    </div>
                  </div>
                ) : null}

                {conversation.status === 'PENDING' && !isSeller ? (
                  <div className="messages-detail__locked">
                    <Lock size={20} aria-hidden="true" />
                    <div>
                      <strong>{t('lockedTitle')}</strong>
                      <p>{t('lockedBuyer')}</p>
                    </div>
                  </div>
                ) : null}

                {conversation.status === 'DECLINED' ? (
                  <Alert tone="error">
                    <strong>{t('declinedTitle')}</strong>
                    <p style={{ margin: '0.25rem 0 0' }}>{t('declinedDesc')}</p>
                  </Alert>
                ) : null}

                {conversation.status === 'OPEN' ? (
                  <>
                    <div className="messages-thread" role="log" aria-label={t('thread')}>
                      {messagesLoading ? (
                        <ChatThreadSkeleton />
                      ) : messages.length === 0 ? (
                        <p className="messages-thread__empty">{t('noMessages')}</p>
                      ) : (
                        messages.map((m) => {
                          const mine = m.senderId === user?.id;
                          return (
                            <div
                              key={m.id}
                              className={`messages-bubble${mine ? ' is-mine' : ''}`}
                            >
                              <p>{m.content}</p>
                              {m.createdAt ? (
                                <time dateTime={m.createdAt}>
                                  {new Date(m.createdAt).toLocaleString(locale)}
                                </time>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                      <div ref={bottomRef} />
                    </div>

                    <form className="messages-composer" onSubmit={onSend}>
                      <label className="visually-hidden" htmlFor={inputId}>
                        {t('placeholder')}
                      </label>
                      <input
                        id={inputId}
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder={t('placeholder')}
                        autoComplete="off"
                        required
                      />
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!draft.trim() || sendMutation.isPending}
                      >
                        <Send size={16} aria-hidden="true" />
                        {t('send')}
                      </button>
                    </form>
                  </>
                ) : null}

                {error ? <Alert tone="error">{error}</Alert> : null}
              </>
            )}
          </section>
        </div>
      )}
    </PageShell>
  );
}
