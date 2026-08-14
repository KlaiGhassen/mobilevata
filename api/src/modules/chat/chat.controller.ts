import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';

class CreateOfferDto {
  @IsString()
  vehicleId: string;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsNumber()
  offerPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;
}

class SendChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private readonly gateway: ChatGateway,
  ) {}

  @Get('conversations')
  list(@CurrentUser() user: AuthUser) {
    return this.chat.listForUser(user.userId);
  }

  @Get('conversations/:id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.chat.getOne(user.userId, id);
  }

  @Get('conversations/:id/messages')
  messages(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.chat.getMessages(user.userId, id);
  }

  @Post('offers')
  async offer(@CurrentUser() user: AuthUser, @Body() dto: CreateOfferDto) {
    const conversation = await this.chat.createOffer(user.userId, dto);
    this.gateway.emitConversationUpdated(
      conversation as { buyerId: string; sellerId: string },
    );
    return conversation;
  }

  @Post('conversations/:id/accept')
  async accept(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const conversation = await this.chat.accept(user.userId, id);
    this.gateway.emitConversationUpdated(
      conversation as { buyerId: string; sellerId: string },
    );
    return conversation;
  }

  @Post('conversations/:id/decline')
  async decline(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const conversation = await this.chat.decline(user.userId, id);
    this.gateway.emitConversationUpdated(
      conversation as { buyerId: string; sellerId: string },
    );
    return conversation;
  }

  @Post('conversations/:id/messages')
  async send(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SendChatDto,
  ) {
    const message = await this.chat.sendMessage(user.userId, id, dto.content);
    this.gateway.server
      ?.to(`conversation:${id}`)
      .emit('message:new', { conversationId: id, message });
    return message;
  }
}
