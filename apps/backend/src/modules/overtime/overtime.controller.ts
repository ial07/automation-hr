import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard, JwtPayload } from '../../core/guards/jwt-auth.guard';
import { OvertimeService } from './overtime.service';
import type { Request } from 'express';

class SubmitOvertimeDto {
  date: string;
  start_time: string;
  end_time: string;
  reason: string;
}

class ApprovalDto {
  action: 'approve' | 'reject';
  notes?: string;
}

@Controller('overtime')
@UseGuards(JwtAuthGuard)
export class OvertimeController {
  constructor(private overtimeService: OvertimeService) {}

  @Get()
  async getMyRequests(@Req() req: Request) {
    const user = (req as any).user as JwtPayload;
    return this.overtimeService.getMyRequests(user.userId);
  }

  @Get('approvals')
  async getApprovals(@Req() req: Request) {
    const user = (req as any).user as JwtPayload;
    if (user.role !== 'manager' && user.role !== 'hr' && user.role !== 'owner') {
      return { requests: [] };
    }
    return this.overtimeService.getPendingApprovals();
  }

  @Post()
  async submit(@Body() body: SubmitOvertimeDto, @Req() req: Request) {
    const user = (req as any).user as JwtPayload;
    return this.overtimeService.submitRequest(
      user.userId, body.date, body.start_time, body.end_time, body.reason,
    );
  }

  @Patch(':id')
  async approve(@Param('id') id: string, @Body() body: ApprovalDto, @Req() req: Request) {
    const user = (req as any).user as JwtPayload;
    const approverRole = user.role === 'manager' ? 'manager' : 'hr';
    return this.overtimeService.approveOrReject(id, user.userId, approverRole, body.action, body.notes);
  }
}
