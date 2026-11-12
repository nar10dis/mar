import { Body, Controller, Get, Post } from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import type { CreateMessageInput } from './messages.service.js';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get()
  list() {
    return this.messages.findLatest();
  }

  @Post()
  create(@Body() body: CreateMessageInput) {
    return this.messages.create(body);
  }
}
