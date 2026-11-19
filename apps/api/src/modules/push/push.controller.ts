import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import { CurrentTenantId } from '../../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { PushService } from './push.service';

class SubscribeDto {
  @IsString() @MinLength(8) endpoint!: string;
  @IsObject() keys!: { p256dh: string; auth: string };
  @IsOptional() @IsString() userAgent?: string;
}

@Controller('push')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.TENANT_OWNER,
  UserRole.MANAGER,
  UserRole.OPERATOR,
  UserRole.KITCHEN,
)
export class PushController {
  constructor(private readonly push: PushService) {}

  @Get('subscriptions')
  list(@CurrentTenantId() tenantId: string) {
    return this.push.list(tenantId);
  }

  @Post('subscribe')
  subscribe(@CurrentTenantId() tenantId: string, @Body() body: SubscribeDto) {
    return this.push.subscribe(tenantId, body);
  }

  @Delete('subscribe')
  unsubscribe(
    @CurrentTenantId() tenantId: string,
    @Body() body: { endpoint: string },
  ) {
    return this.push.unsubscribe(tenantId, body.endpoint);
  }

  @Post('test')
  test(@CurrentTenantId() tenantId: string) {
    return this.push.notifyTenant(tenantId, {
      title: 'Platform Cardápio',
      body: 'Notificação de teste (stub).',
      url: '/painel/pedidos',
    });
  }
}
