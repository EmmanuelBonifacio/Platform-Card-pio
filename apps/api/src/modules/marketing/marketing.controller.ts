import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CampaignType, Prisma, UserRole } from '@prisma/client';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CurrentTenantId } from '../../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { MarketingService } from './marketing.service';

class CouponDto {
  @IsString() @MinLength(2) code!: string;
  @IsOptional() @IsString() description?: string;
  @IsIn(['percent', 'fixed']) discountType!: 'percent' | 'fixed';
  @IsInt() @Min(1) @Type(() => Number) discountValue!: number;
  @IsOptional() @IsInt() @Type(() => Number) minOrderCents?: number;
  @IsOptional() @IsInt() @Type(() => Number) maxRedemptions?: number;
  @IsOptional() @IsString() startsAt?: string;
  @IsOptional() @IsString() endsAt?: string;
}

class CampaignDto {
  @IsString() @MinLength(2) name!: string;
  @IsEnum(CampaignType) type!: CampaignType;
  @IsOptional() payload?: Prisma.InputJsonValue;
  @IsOptional() @IsString() startsAt?: string;
  @IsOptional() @IsString() endsAt?: string;
}

@Controller('marketing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TENANT_OWNER, UserRole.MANAGER, UserRole.MARKETING)
export class MarketingController {
  constructor(private readonly marketing: MarketingService) {}

  @Get('coupons')
  coupons(@CurrentTenantId() tenantId: string) {
    return this.marketing.listCoupons(tenantId);
  }

  @Post('coupons')
  createCoupon(@CurrentTenantId() tenantId: string, @Body() body: CouponDto) {
    return this.marketing.createCoupon(tenantId, body);
  }

  @Patch('coupons/:id')
  toggleCoupon(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.marketing.toggleCoupon(tenantId, id, body.isActive);
  }

  @Get('campaigns')
  campaigns(@CurrentTenantId() tenantId: string) {
    return this.marketing.listCampaigns(tenantId);
  }

  @Post('campaigns')
  createCampaign(
    @CurrentTenantId() tenantId: string,
    @Body() body: CampaignDto,
  ) {
    return this.marketing.createCampaign(tenantId, body);
  }

  @Patch('campaigns/:id')
  toggleCampaign(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.marketing.toggleCampaign(tenantId, id, !!body.isActive);
  }
}

@Controller('public')
export class MarketingPublicController {
  constructor(private readonly marketing: MarketingService) {}

  @Get(':tenantSlug/coupons/validate')
  async validate(
    @Param('tenantSlug') slug: string,
    @Query('code') code: string,
    @Query('orderCents') orderCents = '0',
  ) {
    return this.marketing.validateCouponBySlug(
      slug,
      code,
      Number(orderCents) || 0,
    );
  }
}
