import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ChatMessage,
  ChatMessageDocument,
  Conversation,
  ConversationDocument,
  ConversationStatus,
} from '../../database/schemas/chat.schema';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { toId } from '../../common/mappers/serialize';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversations: Model<ConversationDocument>,
    @InjectModel(ChatMessage.name)
    private readonly messages: Model<ChatMessageDocument>,
    private readonly vehicles: VehiclesRepository,
  ) {}

  private serializeConversation(doc: ConversationDocument) {
    const o = doc.toObject() as unknown as Record<string, unknown>;
    return {
      id: toId(o._id),
      status: o.status,
      offerMessage: o.offerMessage,
      offerPrice: o.offerPrice,
      phone: o.phone,
      lastMessageAt: o.lastMessageAt,
      lastMessagePreview: o.lastMessagePreview,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      vehicleId: toId(o.vehicleId),
      buyerId: toId(o.buyerId),
      sellerId: toId(o.sellerId),
      vehicle: typeof o.vehicleId === 'object' ? o.vehicleId : undefined,
      buyer: typeof o.buyerId === 'object' ? o.buyerId : undefined,
      seller: typeof o.sellerId === 'object' ? o.sellerId : undefined,
    };
  }

  private serializeMessage(doc: ChatMessageDocument) {
    const o = doc.toObject() as unknown as Record<string, unknown>;
    return {
      id: toId(o._id),
      conversationId: toId(o.conversationId),
      senderId: toId(o.senderId),
      content: o.content,
      read: o.read,
      createdAt: o.createdAt,
      sender: typeof o.senderId === 'object' ? o.senderId : undefined,
    };
  }

  /** Buyer starts an offer / contact request — chat locked until seller accepts */
  async createOffer(
    buyerId: string,
    data: { vehicleId: string; message: string; offerPrice?: number; phone?: string },
  ) {
    const vehicle = await this.vehicles.findById(data.vehicleId);
    if (!vehicle || !vehicle.published) {
      throw new NotFoundException('Vehicle not found');
    }
    const sellerId = vehicle.sellerId.toString();
    if (sellerId === buyerId) {
      throw new BadRequestException('You cannot contact yourself');
    }

    const existing = await this.conversations.findOne({
      vehicleId: vehicle._id,
      buyerId: new Types.ObjectId(buyerId),
    });
    if (existing) {
      return this.serializeConversation(
        await existing.populate([
          { path: 'vehicleId', select: 'title price images city country' },
          { path: 'buyerId', select: 'firstName lastName' },
          { path: 'sellerId', select: 'firstName lastName' },
        ]),
      );
    }

    const created = await this.conversations.create({
      vehicleId: vehicle._id,
      buyerId: new Types.ObjectId(buyerId),
      sellerId: vehicle.sellerId,
      status: ConversationStatus.PENDING,
      offerMessage: data.message,
      offerPrice: data.offerPrice,
      phone: data.phone,
      lastMessageAt: new Date(),
      lastMessagePreview: data.message.slice(0, 120),
    });

    return this.serializeConversation(
      await created.populate([
        { path: 'vehicleId', select: 'title price images city country' },
        { path: 'buyerId', select: 'firstName lastName' },
        { path: 'sellerId', select: 'firstName lastName' },
      ]),
    );
  }

  async listForUser(userId: string) {
    const uid = new Types.ObjectId(userId);
    const items = await this.conversations
      .find({ $or: [{ buyerId: uid }, { sellerId: uid }] })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate('vehicleId', 'title price images city country')
      .populate('buyerId', 'firstName lastName')
      .populate('sellerId', 'firstName lastName')
      .exec();
    return items.map((c) => this.serializeConversation(c));
  }

  async getOne(userId: string, conversationId: string) {
    const c = await this.conversations
      .findById(conversationId)
      .populate('vehicleId', 'title price images city country sellerId')
      .populate('buyerId', 'firstName lastName')
      .populate('sellerId', 'firstName lastName')
      .exec();
    if (!c) throw new NotFoundException('Conversation not found');
    this.assertParticipant(userId, c);
    return this.serializeConversation(c);
  }

  async accept(sellerId: string, conversationId: string) {
    const c = await this.conversations.findById(conversationId);
    if (!c) throw new NotFoundException('Conversation not found');
    if (c.sellerId.toString() !== sellerId) throw new ForbiddenException();
    if (c.status !== ConversationStatus.PENDING) {
      throw new BadRequestException('Only pending offers can be accepted');
    }
    c.status = ConversationStatus.OPEN;
    c.lastMessageAt = new Date();
    await c.save();
    return this.getOne(sellerId, conversationId);
  }

  async decline(sellerId: string, conversationId: string) {
    const c = await this.conversations.findById(conversationId);
    if (!c) throw new NotFoundException('Conversation not found');
    if (c.sellerId.toString() !== sellerId) throw new ForbiddenException();
    if (c.status !== ConversationStatus.PENDING) {
      throw new BadRequestException('Only pending offers can be declined');
    }
    c.status = ConversationStatus.DECLINED;
    await c.save();
    return this.getOne(sellerId, conversationId);
  }

  async getMessages(userId: string, conversationId: string) {
    const c = await this.conversations.findById(conversationId);
    if (!c) throw new NotFoundException('Conversation not found');
    this.assertParticipant(userId, c);
    const items = await this.messages
      .find({ conversationId: c._id })
      .sort({ createdAt: 1 })
      .populate('senderId', 'firstName lastName')
      .exec();
    return items.map((m) => this.serializeMessage(m));
  }

  /** Realtime + REST — only when conversation is OPEN */
  async sendMessage(userId: string, conversationId: string, content: string) {
    const c = await this.conversations.findById(conversationId);
    if (!c) throw new NotFoundException('Conversation not found');
    this.assertParticipant(userId, c);
    if (c.status !== ConversationStatus.OPEN) {
      throw new ForbiddenException(
        'Chat unlocks after the seller accepts the offer',
      );
    }
    const msg = await this.messages.create({
      conversationId: c._id,
      senderId: new Types.ObjectId(userId),
      content: content.trim(),
    });
    c.lastMessageAt = new Date();
    c.lastMessagePreview = content.trim().slice(0, 120);
    await c.save();
    const populated = await msg.populate('senderId', 'firstName lastName');
    return this.serializeMessage(populated);
  }

  async canJoin(userId: string, conversationId: string) {
    const c = await this.conversations.findById(conversationId);
    if (!c) return false;
    return (
      c.buyerId.toString() === userId || c.sellerId.toString() === userId
    );
  }

  private assertParticipant(userId: string, c: ConversationDocument) {
    if (c.buyerId.toString() !== userId && c.sellerId.toString() !== userId) {
      throw new ForbiddenException();
    }
  }
}
