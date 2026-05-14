import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import type { Request } from 'express';

export type JwtPayload = {
  userId: string;
  email: string;
  role: 'employee' | 'manager' | 'hr' | 'owner';
  fullName: string | null;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.['session'];

    if (!token) {
      throw new UnauthorizedException('No session token');
    }

    try {
      const secret =
        process.env.JWT_SECRET || 'HRAutomaationSecretKey-MustBe32CharsLong!';
      const payload = jwt.verify(token, secret) as JwtPayload;
      (request as any).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
  }
}
