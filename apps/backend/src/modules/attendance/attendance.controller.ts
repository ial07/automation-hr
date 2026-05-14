import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard, JwtPayload } from '../../core/guards/jwt-auth.guard';
import { AttendanceService } from './attendance.service';
import type { Request } from 'express';

class AttendanceActionDto {
  action: 'check-in' | 'check-out';
  notes?: string;
  is_wfh?: boolean;
}

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  private logger = new Logger('AttendanceController');

  constructor(private attendanceService: AttendanceService) {}

  @Get()
  async getMyAttendance(@Req() req: Request) {
    const user = (req as any).user as JwtPayload;
    this.logger.log(`GET /attendance for user ${user.userId}`);
    return this.attendanceService.getMyAttendance(user.userId);
  }

  @Post()
  async performAction(@Body() body: AttendanceActionDto, @Req() req: Request) {
    const user = (req as any).user as JwtPayload;
    this.logger.log(`POST /attendance action=${body.action} for ${user.userId}`);
    if (body.action === 'check-in') {
      return this.attendanceService.checkIn(user.userId, body.notes, body.is_wfh);
    } else {
      return this.attendanceService.checkOut(user.userId, body.notes);
    }
  }
}
