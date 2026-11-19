import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

type AuthRequest = {
  tenantId?: string;
  user?: { sub: string; tenantId?: string | null; role?: string; email?: string };
};

export const CurrentTenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();
    const tenantId = request.tenantId ?? request.user?.tenantId ?? undefined;
    if (!tenantId) {
      throw new UnauthorizedException('tenantId missing on request');
    }
    return tenantId;
  },
);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();
    return request.user;
  },
);
