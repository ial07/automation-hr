import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './core/auth/auth.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { LeaveModule } from './modules/leave/leave.module';
import { AiModule } from './modules/ai/ai.module';
import { OvertimeModule } from './modules/overtime/overtime.module';
import { InsightsModule } from './modules/insights/insights.module';
import { DocumentsModule } from './modules/documents/documents.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    AttendanceModule,
    LeaveModule,
    AiModule,
    OvertimeModule,
    InsightsModule,
    DocumentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
