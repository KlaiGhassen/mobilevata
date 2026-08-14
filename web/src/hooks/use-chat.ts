'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  client,
  type ChatMessage,
  type Conversation,
} from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useConversations(token: string | null) {
  return useQuery({
    queryKey: queryKeys.conversations(),
    queryFn: () => client.listConversations(token!),
    enabled: Boolean(token),
  });
}

export function useConversation(token: string | null, id: string | null) {
  return useQuery({
    queryKey: queryKeys.conversation(id ?? ''),
    queryFn: () => client.getConversation(token!, id!),
    enabled: Boolean(token && id),
  });
}

export function useChatMessages(token: string | null, conversationId: string | null) {
  return useQuery({
    queryKey: queryKeys.chatMessages(conversationId ?? ''),
    queryFn: () => client.getChatMessages(token!, conversationId!),
    enabled: Boolean(token && conversationId),
  });
}

function invalidateChat(qc: ReturnType<typeof useQueryClient>, conversationId?: string) {
  qc.invalidateQueries({ queryKey: queryKeys.conversations() });
  if (conversationId) {
    qc.invalidateQueries({ queryKey: queryKeys.conversation(conversationId) });
    qc.invalidateQueries({ queryKey: queryKeys.chatMessages(conversationId) });
  }
}

export function useCreateOffer(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      vehicleId: string;
      message: string;
      offerPrice?: number;
      phone?: string;
    }) => {
      if (!token) throw new Error('CONNECT');
      return client.createOffer(token, data);
    },
    onSuccess: (conversation) => {
      qc.setQueryData(queryKeys.conversation(conversation.id), conversation);
      invalidateChat(qc, conversation.id);
    },
  });
}

export function useAcceptConversation(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!token) throw new Error('CONNECT');
      return client.acceptConversation(token, id);
    },
    onSuccess: (conversation) => {
      qc.setQueryData(queryKeys.conversation(conversation.id), conversation);
      invalidateChat(qc, conversation.id);
    },
  });
}

export function useDeclineConversation(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!token) throw new Error('CONNECT');
      return client.declineConversation(token, id);
    },
    onSuccess: (conversation) => {
      qc.setQueryData(queryKeys.conversation(conversation.id), conversation);
      invalidateChat(qc, conversation.id);
    },
  });
}

export function useSendChatMessage(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => {
      if (!token) throw new Error('CONNECT');
      return client.sendChatMessage(token, conversationId, content);
    },
    onSuccess: (message, vars) => {
      qc.setQueryData<ChatMessage[]>(
        queryKeys.chatMessages(vars.conversationId),
        (old = []) => (old.some((m) => m.id === message.id) ? old : [...old, message]),
      );
      qc.setQueryData<Conversation[]>(queryKeys.conversations(), (old = []) =>
        old.map((c) =>
          c.id === vars.conversationId
            ? {
                ...c,
                lastMessageAt: message.createdAt,
                lastMessagePreview: message.content.slice(0, 120),
              }
            : c,
        ),
      );
    },
  });
}
