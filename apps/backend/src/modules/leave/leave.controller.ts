import {
  Controller, Get, Post, Put, Body, Param,
  UseGuards, Req, Logger,
} from '@nestjs/common';
import { JwtAuthGuard, JwtPayload } from '../../core/guards/jwt-auth.guard';
import { LeaveService } from './leave.service';
import { LeaveType } from '@prisma/client';
import type { Request } from 'express';

class SubmitLeaveDto {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason?: string;
}

class ApprovalDto {
  action: 'approve' | 'reject';
  notes?: string;
}

@Controller('leave')
@UseGuards(JwtAuthGuard)
export class LeaveController {
  private logger = new Logger('LeaveController');

  constructor(private leaveService: LeaveService) {}

  @Get()
  async getMyRequests(@Req() req: Request) {
    const user = (req as any).user as JwtPayload;
    this.logger.log(`GET /leave for user ${user.userId}`);
    return this.leaveService.getMyRequests(user.userId);
  }

  @Get('balance')
  async getBalance(@Req() req: Request) {
    const user = (req as any).user as JwtPayload;
    return this.leaveService.getBalance(user.userId);
  }

  @Post()
  async submitRequest(@Body() body: SubmitLeaveDto, @Req() req: Request) {
    const user = (req as any).user as JwtPayload;
    this.logger.log(`POST /leave type=${body.leave_type} for ${user.userId}`);
    return this.leaveService.submitRequest(
      user.userId, body.leave_type, body.start_date, body.end_date, body.reason,
    );
  }

  @Get('approvals')
  async getPendingApprovals(@Req() req: Request) {
    const user = (req as any).user as JwtPayload;
    if (user.role !== 'manager' && user.role !== 'hr' && user.role !== 'owner') {
      return { requests: [] };
    }
    return { requests: await this.leaveService.getPendingApprovals() };
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string, @Body() body: ApprovalDto, @Req() req: Request) {
    const user = (req as any).user as JwtPayload;
    const approverRole = user.role === 'manager' ? 'manager' : 'hr';
    return this.leaveService.approveOrReject(id, user.userId, approverRole, body.action, body.notes);
  }
}
