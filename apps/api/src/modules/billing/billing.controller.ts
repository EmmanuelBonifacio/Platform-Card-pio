import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PaymentMethod, UserRole } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  CurrentTenantId,
  CurrentUser,
} from '../../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { BillingService } from './billing.service';

class CheckoutDto {
  @IsString()
  planCode!: string;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsOptional()
  @IsString()
  provider?: 'manual' | 'asaas';
}

@Controller('gestor')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('plans')
  @Roles(
    UserRole.TENANT_OWNER,
    UserRole.MANAGER,
    UserRole.SUPER_ADMIN,
  )
  plans() {
    return this.billing.listPlans();
  }

  @Get('subscription')
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  subscription(@CurrentTenantId() tenantId: string) {
    return this.billing.getSubscription(tenantId);
  }

  @Post('checkout')
  @Roles(UserRole.TENANT_OWNER)
  checkout(
    @CurrentTenantId() tenantId: string,
    @Body() body: CheckoutDto,
  ) {
    return this.billing.checkout(
      tenantId,
      body.planCode,
      body.method,
      body.provider ?? 'manual',
    );
  }

  @Post('admin/trust-release')
  @Roles(UserRole.SUPER_ADMIN)
  trust(
    @Body()
    body: {
      tenantId: string;
      reason: string;
      hours?: number;
      extraOrders?: number;
    },
    @CurrentUser() user: { sub: string },
  ) {
    return this.billing.trustRelease(
      body.tenantId,
      user.sub,
      body.reason,
      body.hours ?? 48,
      body.extraOrders ?? 20,
    );
  }
}
