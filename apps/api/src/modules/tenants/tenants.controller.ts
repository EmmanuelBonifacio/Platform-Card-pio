import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';
import { CurrentTenantId } from '../../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { TenantsService } from './tenants.service';

class TrackingDto {
  @IsOptional() @IsString() metaPixelId?: string | null;
  @IsOptional() @IsString() gaMeasurementId?: string | null;
  @IsOptional() @IsString() gtmContainerId?: string | null;
  @IsOptional() @IsString() subdomain?: string | null;
}

@Controller()
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  @Get('tenant/settings')
  settings(@CurrentTenantId() tenantId: string) {
    return this.tenants.getSettings(tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  @Patch('tenant/tracking')
  tracking(
    @CurrentTenantId() tenantId: string,
    @Body() body: TrackingDto,
  ) {
    return this.tenants.updateTracking(tenantId, body);
  }

  @Get('public/:tenantSlug/tracking')
  publicTracking(@Param('tenantSlug') slug: string) {
    return this.tenants.publicTracking(slug);
  }
}
