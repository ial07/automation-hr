import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config({ override: true });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

@Injectable()
export class InsightsService {
  private readonly logger = new Logger('InsightsService');

  constructor(private prisma: PrismaService) {}

  private getLast30DaysRange() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return { startDate: start, endDate: end };
  }

  async getComprehensiveInsights() {
    const { startDate, endDate } = this.getLast30DaysRange();

    const employees = await this.prisma.user.findMany({
      where: { role: { in: ['employee', 'manager'] } },
      select: { id: true, full_name: true, email: true },
    });
    
    const employeeMap = new Map(employees.map(e => [e.id, e.full_name || e.email]));
    const totalEmployees = employees.length;

    const attendances = await this.prisma.attendanceRecord.findMany({
      where: { date: { gte: startDate, lte: endDate } },
    });

    const attendanceStats = { totalPresent: 0, totalLate: 0, totalWfh: 0, totalLeave: 0, complianceRate: 0 };
    const lateCountByUser: Record<string, number> = {};

    attendances.forEach(r => {
      if (r.status === 'present') attendanceStats.totalPresent++;
      if (r.status === 'late') {
        attendanceStats.totalLate++;
        lateCountByUser[r.user_id] = (lateCountByUser[r.user_id] || 0) + 1;
      }
      if (r.status === 'wfh') attendanceStats.totalWfh++;
      if (r.status === 'leave') attendanceStats.totalLeave++;
    });

    const totalRecords = attendances.length || 1;
    attendanceStats.complianceRate = Math.round(((attendanceStats.totalPresent + attendanceStats.totalWfh) / totalRecords) * 100);

    const leaves = await this.prisma.leaveRequest.findMany({
      where: { created_at: { gte: startDate } },
    });

    const leaveStats = { pendingRequests: 0, approvedThisMonth: 0, rejectedThisMonth: 0, totalDaysTaken: 0 };
    
    leaves.forEach(r => {
      if (r.status === 'submitted' || r.status === 'approved_manager') leaveStats.pendingRequests++;
      if (r.status === 'approved_hr') {
        leaveStats.approvedThisMonth++;
        leaveStats.totalDaysTaken += r.total_days;
      }
      if (r.status === 'rejected_manager' || r.status === 'rejected_hr') leaveStats.rejectedThisMonth++;
    });

    const overtimes = await this.prisma.overtimeRecord.findMany({
      where: { created_at: { gte: startDate } },
    });

    const overtimeStats = { pendingRequests: 0, approvedRequests: 0, totalHours: 0 };
    const overtimeByUser: Record<string, number> = {};

    overtimes.forEach(r => {
      if (r.status === 'submitted' || r.status === 'approved_manager') overtimeStats.pendingRequests++;
      if (r.status === 'approved_hr') {
        overtimeStats.approvedRequests++;
        overtimeStats.totalHours += Number(r.hours);
        overtimeByUser[r.employee_id] = (overtimeByUser[r.employee_id] || 0) + Number(r.hours);
      }
    });

    const flags: any[] = [];
    for (const [userId, count] of Object.entries(lateCountByUser)) {
      if (count >= 3) {
        flags.push({
          type: 'frequent_lateness',
          severity: count >= 5 ? 'high' : 'medium',
          description: `Terlambat ${count} kali dalam 30 hari`,
          employeeName: employeeMap.get(userId) || 'Unknown',
          data: { lateCount: count },
        });
      }
    }

    const aiSummary = await this.generateAISummary({
      totalEmployees,
      attendance: attendanceStats,
      leave: leaveStats,
      overtime: overtimeStats,
      flags,
    });

    const insightCards = [
      {
        id: 'late-trend',
        title: 'Tren Keterlambatan',
        description: attendanceStats.totalLate > 5 ? 'Peningkatan keterlambatan.' : 'Keterlambatan normal.',
        metric: `${attendanceStats.totalLate} keterlambatan`,
        signal: attendanceStats.totalLate > 10 ? 'needs_attention' : 'stable',
      },
      {
        id: 'compliance-rate',
        title: 'Tingkat Kepatuhan',
        description: `Kepatuhan kehadiran ${attendanceStats.complianceRate}%`,
        metric: `${attendanceStats.complianceRate}%`,
        signal: attendanceStats.complianceRate < 80 ? 'needs_attention' : 'stable',
      }
    ];

    return {
      period: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
      summary: { totalEmployees, totalWorkingDays: 22, attendanceRecords: totalRecords },
      attendance: attendanceStats,
      leave: leaveStats,
      overtime: overtimeStats,
      insightCards,
      flags,
      aiSummary,
    };
  }

  private async generateAISummary(data: any): Promise<string> {
    const prompt = `Anda adalah analis HR. Buat ringkasan (3 kalimat) dalam bahasa Indonesia:
DATA: ${data.totalEmployees} karyawan, Kepatuhan ${data.attendance.complianceRate}%, Terlambat ${data.attendance.totalLate}x, Cuti ${data.leave.totalDaysTaken} hari, Lembur ${data.overtime.totalHours} jam.`;
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });
      return response.choices[0]?.message?.content || 'Ringkasan tidak tersedia.';
    } catch (err) {
      this.logger.error('Failed to generate AI summary', err);
      return 'Gagal memuat ringkasan AI.';
    }
  }
}
