import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard, JwtPayload } from '../../core/guards/jwt-auth.guard';
import { InsightsService } from './insights.service';
import type { Request } from 'express';

@Controller('hr/insights')
@UseGuards(JwtAuthGuard)
export class InsightsController {
  constructor(private insightsService: InsightsService) {}

  @Get()
  async getInsights(@Req() req: Request) {
    const user = (req as any).user as JwtPayload;
    if (user.role !== 'manager' && user.role !== 'hr' && user.role !== 'owner') {
      return { error: 'Unauthorized' };
    }
    return this.insightsService.getComprehensiveInsights();
  }
}
