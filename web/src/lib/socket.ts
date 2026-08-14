import { io, type Socket } from 'socket.io-client';
import { API_URL } from '@/lib/api';

let chatSocket: Socket | null = null;
let chatKey: string | null = null;

/** Singleton socket.io client for the `/chat` namespace (cookie + optional JWT). */
export function getChatSocket(sessionToken: string): Socket {
  const key = sessionToken || 'cookie';
  if (chatSocket && chatKey === key && chatSocket.connected) {
    return chatSocket;
  }
  if (chatSocket) {
    chatSocket.removeAllListeners();
    chatSocket.disconnect();
    chatSocket = null;
  }
  chatKey = key;
  const auth =
    sessionToken && sessionToken.includes('.')
      ? { token: sessionToken }
      : {};
  chatSocket = io(`${API_URL}/chat`, {
    auth,
    withCredentials: true,
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
  return chatSocket;
}

export function disconnectChatSocket() {
  if (chatSocket) {
    chatSocket.removeAllListeners();
    chatSocket.disconnect();
    chatSocket = null;
    chatKey = null;
  }
}
