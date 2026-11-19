import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JwtPayload } from '../../modules/auth/jwt.strategy';

/**
 * Propaga tenantId do JWT para request.tenantId.
 * Rotas públicas resolvem tenant por slug no próprio controller.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request & { user?: JwtPayload; tenantId?: string }, _res: Response, next: NextFunction) {
    if (req.user?.tenantId) {
      req.tenantId = req.user.tenantId;
    }
    next();
  }
}
