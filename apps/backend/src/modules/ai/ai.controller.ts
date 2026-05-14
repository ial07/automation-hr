import { Controller, Post, Body, UseGuards, Req, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard, JwtPayload } from '../../core/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import type { Request } from 'express';

class ChatDto {
  question: string;
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class AiController {
  private readonly logger = new Logger('AiController');

  constructor(private aiService: AiService) {}

  @Post()
  async chat(@Body() body: ChatDto, @Req() req: Request) {
    const user = (req as any).user as JwtPayload;

    if (!body.question?.trim()) {
      throw new HttpException('Question is required', HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`POST /chat from user=${user.userId} role=${user.role}`);

    try {
      const result = await this.aiService.chat(
        body.question.trim(),
        user.userId,
        user.role,
      );
      return result;
    } catch (err) {
      this.logger.error('[AI] Chat failed: ' + (err as Error).message, (err as Error).stack);
      throw new HttpException(
        { error: 'AI service unavailable. Please try again.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
