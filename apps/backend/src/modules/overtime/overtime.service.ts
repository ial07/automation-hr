import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class OvertimeService {
  constructor(private prisma: PrismaService) {}

  private formatRequest(r: any) {
    return {
      id: r.id,
      date: r.date.toISOString().split('T')[0],
      start_time: r.start_time.toISOString().substring(11, 16),
      end_time: r.end_time.toISOString().substring(11, 16),
      hours: Number(r.hours),
      reason: r.reason,
      status: r.status,
      created_at: r.created_at.toISOString(),
      employee: r.employee ? { fullName: r.employee.full_name, email: r.employee.email } : undefined,
    };
  }

  async getMyRequests(userId: string) {
    const requests = await this.prisma.overtimeRecord.findMany({
      where: { employee_id: userId },
      orderBy: { created_at: 'desc' },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const approvedThisMonth = await this.prisma.overtimeRecord.findMany({
      where: {
        employee_id: userId,
        status: 'approved_hr',
        date: { gte: startOfMonth },
      },
    });

    const monthlyTotal = approvedThisMonth.reduce((acc, curr) => acc + Number(curr.hours), 0);

    return {
      requests: requests.map(this.formatRequest),
      monthlyTotal,
    };
  }

  async submitRequest(
    userId: string,
    date: string,
    start_time: string,
    end_time: string,
    reason: string,
  ) {
    const s = new Date(`1970-01-01T${start_time}:00Z`);
    const e = new Date(`1970-01-01T${end_time}:00Z`);
    let hours = (e.getTime() - s.getTime()) / (1000 * 60 * 60);
    if (hours < 0) hours += 24; // Handle overnight

    if (hours <= 0) throw new BadRequestException('Invalid time range');

    const request = await this.prisma.overtimeRecord.create({
      data: {
        employee_id: userId,
        date: new Date(date),
        start_time: new Date(`${date}T${start_time}:00Z`), // Simplify, ignoring exact timezone offset issues for now
        end_time: new Date(`${date}T${end_time}:00Z`),
        hours: hours,
        reason,
        status: 'submitted',
      },
    });

    return { request: this.formatRequest(request) };
  }

  async getPendingApprovals() {
    const requests = await this.prisma.overtimeRecord.findMany({
      where: { status: { in: ['submitted', 'approved_manager'] } },
      include: { employee: { select: { full_name: true, email: true } } },
      orderBy: { created_at: 'asc' },
    });
    return { requests: requests.map((r) => this.formatRequest(r)) };
  }

  async approveOrReject(
    requestId: string,
    approverId: string,
    approverRole: 'manager' | 'hr',
    action: 'approve' | 'reject',
    notes?: string,
  ) {
    const request = await this.prisma.overtimeRecord.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');

    let newStatus = request.status;
    if (approverRole === 'manager') {
      newStatus = action === 'approve' ? 'approved_manager' : 'rejected_manager';
    } else {
      newStatus = action === 'approve' ? 'approved_hr' : 'rejected_hr';
    }

    const updated = await this.prisma.overtimeRecord.update({
      where: { id: requestId },
      data: {
        status: newStatus as any,
        approved_by: approverId,
        approved_at: new Date(),
        notes,
      },
    });

    return { success: true, request: this.formatRequest(updated) };
  }
}
