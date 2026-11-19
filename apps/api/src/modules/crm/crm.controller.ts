import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { CurrentTenantId } from '../../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { CrmService } from './crm.service';

class UpdateCustomerDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsString() segment?: string;
  @IsOptional() @IsBoolean() marketingOptIn?: boolean;
}

@Controller('crm')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TENANT_OWNER, UserRole.MANAGER, UserRole.MARKETING)
export class CrmController {
  constructor(private readonly crm: CrmService) {}

  @Get('customers')
  list(
    @CurrentTenantId() tenantId: string,
    @Query('q') q?: string,
    @Query('segment') segment?: string,
  ) {
    return this.crm.listCustomers(tenantId, { q, segment });
  }

  @Get('segments')
  segments(@CurrentTenantId() tenantId: string) {
    return this.crm.segments(tenantId);
  }

  @Get('customers/:id')
  get(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.crm.getCustomer(tenantId, id);
  }

  @Patch('customers/:id')
  update(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: UpdateCustomerDto,
  ) {
    return this.crm.updateCustomer(tenantId, id, body);
  }
}
