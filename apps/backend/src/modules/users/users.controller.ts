import { Controller, Get, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard, JwtPayload } from '../../core/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import type { Request } from 'express';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req: Request) {
    const user = (req as any).user as JwtPayload;
    const profile = await this.usersService.getMe(user.userId);
    if (!profile) throw new NotFoundException('User not found');
    return profile;
  }
}
