import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentTenantId } from '../../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TENANT_OWNER, UserRole.MANAGER, UserRole.MARKETING)
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get('insights')
  insights(@CurrentTenantId() tenantId: string) {
    return this.ai.insights(tenantId);
  }
}
