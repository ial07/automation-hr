import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  private getTodayDate(): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  }

  async getMyAttendance(userId: string) {
    const today = this.getTodayDate();
    const todayDate = new Date(today);

    const todayRecord = await this.prisma.attendanceRecord.findUnique({
      where: { user_id_date: { user_id: userId, date: todayDate } },
    });

    const history = await this.prisma.attendanceRecord.findMany({
      where: { user_id: userId },
      orderBy: { date: 'desc' },
      take: 30,
    });

    const formatRecord = (r: any) => ({
      id: r.id,
      date: r.date.toISOString().split('T')[0],
      check_in_time: r.check_in_time?.toISOString() || null,
      check_out_time: r.check_out_time?.toISOString() || null,
      status: r.status,
      notes: r.notes,
    });

    return {
      today: todayRecord ? formatRecord(todayRecord) : null,
      history: history.map(formatRecord),
    };
  }

  async checkIn(userId: string, notes?: string, is_wfh?: boolean) {
    const today = this.getTodayDate();
    const todayDate = new Date(today);

    const existing = await this.prisma.attendanceRecord.findUnique({
      where: { user_id_date: { user_id: userId, date: todayDate } },
    });
    if (existing) {
      throw new BadRequestException('Already checked in today');
    }

    // Determine status based on time
    const nowJakarta = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }),
    );
    const cutoffHour = 7;
    const cutoffMinute = 45;
    const isLate =
      nowJakarta.getHours() > cutoffHour ||
      (nowJakarta.getHours() === cutoffHour &&
        nowJakarta.getMinutes() > cutoffMinute);

    let status: AttendanceStatus;
    if (is_wfh) {
      status = 'wfh';
    } else if (isLate) {
      status = 'late';
    } else {
      status = 'present';
    }

    const record = await this.prisma.attendanceRecord.create({
      data: {
        user_id: userId,
        date: todayDate,
        check_in_time: new Date(),
        status,
        notes,
      },
    });

    return {
      record: {
        id: record.id,
        date: record.date.toISOString().split('T')[0],
        check_in_time: record.check_in_time?.toISOString(),
        check_out_time: null,
        status: record.status,
        notes: record.notes,
      },
    };
  }

  async checkOut(userId: string, notes?: string) {
    const today = this.getTodayDate();
    const todayDate = new Date(today);

    const existing = await this.prisma.attendanceRecord.findUnique({
      where: { user_id_date: { user_id: userId, date: todayDate } },
    });
    if (!existing) {
      throw new BadRequestException('Must check in first');
    }
    if (existing.check_out_time) {
      throw new BadRequestException('Already checked out today');
    }

    const record = await this.prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { check_out_time: new Date(), ...(notes ? { notes } : {}) },
    });

    return {
      record: {
        id: record.id,
        date: record.date.toISOString().split('T')[0],
        check_in_time: record.check_in_time?.toISOString(),
        check_out_time: record.check_out_time?.toISOString(),
        status: record.status,
        notes: record.notes,
      },
    };
  }

  async getMonthlyStats(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const records = await this.prisma.attendanceRecord.findMany({
      where: { user_id: userId, date: { gte: startOfMonth } },
      select: { status: true },
    });
    const stats = { present: 0, late: 0, wfh: 0, leave: 0, absent: 0 };
    records.forEach((r) => {
      if (r.status in stats) stats[r.status as keyof typeof stats]++;
    });
    return stats;
  }
}
