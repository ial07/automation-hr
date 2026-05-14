import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AttendanceModule } from '../attendance/attendance.module';
import { LeaveModule } from '../leave/leave.module';

@Module({
  imports: [AttendanceModule, LeaveModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
