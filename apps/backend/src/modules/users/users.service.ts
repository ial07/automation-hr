import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        manager_id: true,
        created_at: true,
      },
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      managerId: user.manager_id,
      createdAt: user.created_at,
    };
  }
}
