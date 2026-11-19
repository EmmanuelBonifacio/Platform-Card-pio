import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ tenantId?: string }>();
    if (!request.tenantId) {
      throw new Error('tenantId missing on request');
    }
    return request.tenantId;
  },
);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: unknown }>();
    return request.user;
  },
);
