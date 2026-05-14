import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { LeaveType, LeaveStatus } from '@prisma/client';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  private calculateWorkingDays(start: string, end: string): number {
    const s = new Date(start);
    const e = new Date(end);
    let count = 0;
    const cur = new Date(s);
    while (cur <= e) {
      const d = cur.getDay();
      if (d !== 0 && d !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }

  private formatRequest(r: any) {
    return {
      id: r.id,
      leave_type: r.leave_type,
      start_date: r.start_date.toISOString().split('T')[0],
      end_date: r.end_date.toISOString().split('T')[0],
      total_days: r.total_days,
      reason: r.reason,
      status: r.status,
      created_at: r.created_at.toISOString(),
    };
  }

  async getMyRequests(userId: string) {
    const requests = await this.prisma.leaveRequest.findMany({
      where: { employee_id: userId },
      orderBy: { created_at: 'desc' },
    });
    const balance = await this.getOrCreateBalance(userId);
    return {
      requests: requests.map(this.formatRequest),
      balance: {
        annual_total: balance.annual_total,
        annual_used: balance.annual_used,
        sick_total: balance.sick_total,
        sick_used: balance.sick_used,
      },
    };
  }

  async getBalance(userId: string) {
    const balance = await this.getOrCreateBalance(userId);
    return {
      balance: {
        annual_total: balance.annual_total,
        annual_used: balance.annual_used,
        sick_total: balance.sick_total,
        sick_used: balance.sick_used,
      },
      remaining: {
        annual: balance.annual_total - balance.annual_used,
        sick: balance.sick_total - balance.sick_used,
      },
    };
  }

  async getOrCreateBalance(userId: string) {
    let balance = await this.prisma.leaveBalance.findUnique({
      where: { user_id: userId },
    });
    if (!balance) {
      balance = await this.prisma.leaveBalance.create({
        data: { user_id: userId },
      });
    }
    return balance;
  }

  async submitRequest(
    userId: string,
    leave_type: LeaveType,
    start_date: string,
    end_date: string,
    reason?: string,
  ) {
    const totalDays = this.calculateWorkingDays(start_date, end_date);
    if (totalDays <= 0) {
      throw new BadRequestException('Invalid date range');
    }

    const request = await this.prisma.leaveRequest.create({
      data: {
        employee_id: userId,
        leave_type,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        total_days: totalDays,
        reason,
        status: 'submitted',
      },
    });

    return this.formatRequest(request);
  }

  async getPendingApprovals() {
    const requests = await this.prisma.leaveRequest.findMany({
      where: { status: { in: ['submitted', 'approved_manager'] } },
      include: { employee: { select: { full_name: true, email: true } } },
      orderBy: { created_at: 'asc' },
    });
    return requests.map((r) => ({
      ...this.formatRequest(r),
      employee: { fullName: r.employee.full_name, email: r.employee.email },
    }));
  }

  async approveOrReject(
    requestId: string,
    approverId: string,
    approverRole: 'manager' | 'hr',
    action: 'approve' | 'reject',
    notes?: string,
  ) {
    const request = await this.prisma.leaveRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');

    let newStatus: LeaveStatus;
    if (approverRole === 'manager') {
      newStatus = action === 'approve' ? 'approved_manager' : 'rejected_manager';
    } else {
      newStatus = action === 'approve' ? 'approved_hr' : 'rejected_hr';
    }

    const updateData: any = { status: newStatus };
    if (approverRole === 'manager') {
      updateData.manager_id = approverId;
      updateData.manager_notes = notes;
      updateData.manager_action_at = new Date();
    } else {
      updateData.hr_id = approverId;
      updateData.hr_notes = notes;
      updateData.hr_action_at = new Date();
    }

    await this.prisma.leaveRequest.update({ where: { id: requestId }, data: updateData });

    // If fully approved by HR, deduct balance
    if (approverRole === 'hr' && action === 'approve') {
      if (request.leave_type === 'annual' || request.leave_type === 'sick') {
        const field = request.leave_type === 'annual' ? 'annual_used' : 'sick_used';
        await this.prisma.leaveBalance.update({
          where: { user_id: request.employee_id },
          data: { [field]: { increment: request.total_days } },
        });
      }
    }

    return { success: true };
  }
}
