import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { CurrentTenantId } from '../../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { WhatsappService } from './whatsapp.service';

class WhatsappConfigDto {
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsBoolean() botEnabled?: boolean;
  @IsOptional() @IsString() welcomeMessage?: string;
  @IsOptional() @IsBoolean() autoReplyEnabled?: boolean;
}

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly wa: WhatsappService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  @Get('config')
  config(@CurrentTenantId() tenantId: string) {
    return this.wa.getConfig(tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  @Patch('config')
  update(
    @CurrentTenantId() tenantId: string,
    @Body() body: WhatsappConfigDto,
  ) {
    return this.wa.updateConfig(tenantId, body);
  }

  /** Webhook público (Meta/Evolution) — stub */
  @Post('webhook')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  inbound(
    @Body()
    body: { tenantSlug?: string; from: string; text?: string },
  ) {
    return this.wa.handleInbound(body);
  }
}
