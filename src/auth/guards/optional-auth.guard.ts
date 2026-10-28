import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;

    // No token: continue as a guest.
    if (!authorization) {
      request.user = undefined;
      return true;
    }

    // A supplied token must be valid.
    return (await super.canActivate(context)) as boolean;
  }

  handleRequest<TUser = any>(err: unknown, user: TUser | false | null): TUser {
    if (err || !user) {
      throw err instanceof Error
        ? err
        : new UnauthorizedException('Invalid or expired token');
    }

    return user;
  }
}
