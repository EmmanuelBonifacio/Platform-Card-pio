import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrentTenantId } from '../../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { AffiliatesService } from './affiliates.service';

class CreateAffiliateDto {
  @IsString() @MinLength(2) code!: string;
  @IsOptional() @IsInt() @Min(0) @Type(() => Number) commissionBps?: number;
}

@Controller('affiliates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TENANT_OWNER, UserRole.MANAGER, UserRole.MARKETING)
export class AffiliatesController {
  constructor(private readonly affiliates: AffiliatesService) {}

  @Get()
  list(@CurrentTenantId() tenantId: string) {
    return this.affiliates.list(tenantId);
  }

  @Post()
  create(
    @CurrentTenantId() tenantId: string,
    @Body() body: CreateAffiliateDto,
  ) {
    return this.affiliates.create(tenantId, body.code, body.commissionBps);
  }
}

@Controller('public')
export class AffiliatesPublicController {
  constructor(
    private readonly affiliates: AffiliatesService,
    private readonly prisma: PrismaService,
  ) {}

  @Post(':tenantSlug/affiliates/:code/click')
  async click(
    @Param('tenantSlug') slug: string,
    @Param('code') code: string,
  ) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new NotFoundException('Loja não encontrada');
    return this.affiliates.trackClick(tenant.id, code);
  }
}
