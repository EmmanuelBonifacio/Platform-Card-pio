import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { CurrentTenantId } from '../../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { StoresService } from './stores.service';

class CreateStoreDto {
  @IsString() @MinLength(2) name!: string;
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() addressJson?: Prisma.InputJsonValue;
}

class UpdateStoreDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string | null;
  @IsOptional() addressJson?: Prisma.InputJsonValue;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@Controller('stores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  @Get()
  list(@CurrentTenantId() tenantId: string) {
    return this.stores.list(tenantId);
  }

  @Post()
  create(@CurrentTenantId() tenantId: string, @Body() body: CreateStoreDto) {
    return this.stores.create(tenantId, body);
  }

  @Patch(':id')
  update(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: UpdateStoreDto,
  ) {
    return this.stores.update(tenantId, id, body);
  }
}
