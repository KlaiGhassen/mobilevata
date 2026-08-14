import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { UsersRepository } from '../users/users.repository';
import { AUTH_COOKIE, readCookie } from '../../common/security/auth-cookie';
import { resolveCorsOrigins } from '../../common/security/cors-origins';

type AuthedSocket = Socket & { data: { userId?: string } };

const MAX_CONTENT = 2000;
const WS_WINDOW_MS = 10_000;
const WS_MAX_MESSAGES = 20;

@WebSocketGateway({
  cors: {
    origin: resolveCorsOrigins(),
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection {
  private readonly logger = new Logger(ChatGateway.name);
  private readonly messageHits = new Map<string, number[]>();

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chat: ChatService,
    private readonly jwt: JwtService,
    private readonly users: UsersRepository,
  ) {}

  private allowMessage(userId: string): boolean {
    const now = Date.now();
    const recent = (this.messageHits.get(userId) || []).filter(
      (t) => now - t < WS_WINDOW_MS,
    );
    if (recent.length >= WS_MAX_MESSAGES) {
      this.messageHits.set(userId, recent);
      return false;
    }
    recent.push(now);
    this.messageHits.set(userId, recent);
    return true;
  }

  async handleConnection(client: AuthedSocket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers.authorization || '').replace(
          /^Bearer\s+/i,
          '',
        ) ||
        readCookie(client.handshake.headers.cookie, AUTH_COOKIE);
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwt.verify<{ sub: string }>(token);
      const user = await this.users.findById(payload.sub);
      if (
        !user ||
        user.status === 'SUSPENDED' ||
        user.status === 'BANNED'
      ) {
        client.disconnect();
        return;
      }
      const userId = String(user._id);
      client.data.userId = userId;
      client.join(`user:${userId}`);
      this.logger.debug(`User ${userId} connected to chat`);
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('conversation:join')
  async join(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId || !body?.conversationId) return { ok: false };
    const allowed = await this.chat.canJoin(userId, body.conversationId);
    if (!allowed) return { ok: false, error: 'Forbidden' };
    client.join(`conversation:${body.conversationId}`);
    return { ok: true };
  }

  @SubscribeMessage('conversation:leave')
  leave(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { conversationId: string },
  ) {
    if (body?.conversationId) client.leave(`conversation:${body.conversationId}`);
    return { ok: true };
  }

  @SubscribeMessage('message:send')
  async send(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { conversationId: string; content: string },
  ) {
    const userId = client.data.userId;
    const content = body?.content?.trim() || '';
    if (!userId || !body?.conversationId || !content) {
      return { ok: false, error: 'Invalid payload' };
    }
    if (content.length > MAX_CONTENT) {
      return { ok: false, error: 'Message too long' };
    }
    if (!this.allowMessage(userId)) {
      return { ok: false, error: 'Too many messages — slow down' };
    }
    try {
      const message = await this.chat.sendMessage(
        userId,
        body.conversationId,
        content,
      );
      this.server
        .to(`conversation:${body.conversationId}`)
        .emit('message:new', { conversationId: body.conversationId, message });
      const conversation = await this.chat.getOne(userId, body.conversationId);
      this.server
        .to(`user:${conversation.buyerId}`)
        .to(`user:${conversation.sellerId}`)
        .emit('conversation:updated', conversation);
      return { ok: true, message };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  emitConversationUpdated(conversation: { buyerId: string; sellerId: string }) {
    this.server
      .to(`user:${conversation.buyerId}`)
      .to(`user:${conversation.sellerId}`)
      .emit('conversation:updated', conversation);
  }
}
