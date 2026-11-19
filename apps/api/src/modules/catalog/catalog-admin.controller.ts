import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CurrentTenantId } from '../../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { CatalogAdminService } from './catalog-admin.service';

class CategoryDto {
  @IsString() @MinLength(2) name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsInt() @Type(() => Number) sortOrder?: number;
  @IsOptional() @IsString() slug?: string;
}

class ProductDto {
  @IsString() @MinLength(2) name!: string;
  @IsOptional() @IsString() description?: string;
  @IsInt() @Min(0) @Type(() => Number) priceCents!: number;
  @IsOptional() @IsInt() @Type(() => Number) promoPriceCents?: number;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsInt() @Type(() => Number) prepMinutes?: number;
  @IsOptional() variations?: Prisma.InputJsonValue;
  @IsOptional() @IsArray() addonIds?: string[];
  @IsOptional() @IsString() slug?: string;
}

class AddonDto {
  @IsString() @MinLength(1) name!: string;
  @IsInt() @Min(0) @Type(() => Number) priceCents!: number;
  @IsOptional() @IsInt() @Type(() => Number) maxQty?: number;
}

class ComboDto {
  @IsString() @MinLength(2) name!: string;
  @IsOptional() @IsString() description?: string;
  @IsInt() @Min(0) @Type(() => Number) priceCents!: number;
  @IsOptional() @IsString() imageUrl?: string;
  @IsArray() items!: Array<{ productId: string; quantity?: number }>;
}

@Controller('catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TENANT_OWNER, UserRole.MANAGER, UserRole.OPERATOR)
export class CatalogAdminController {
  constructor(private readonly admin: CatalogAdminService) {}

  @Get('categories')
  categories(@CurrentTenantId() tenantId: string) {
    return this.admin.listCategories(tenantId);
  }

  @Post('categories')
  createCategory(@CurrentTenantId() tenantId: string, @Body() body: CategoryDto) {
    return this.admin.createCategory(tenantId, body);
  }

  @Patch('categories/:id')
  updateCategory(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: Partial<CategoryDto> & { isActive?: boolean },
  ) {
    return this.admin.updateCategory(tenantId, id, body);
  }

  @Delete('categories/:id')
  deleteCategory(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.admin.deleteCategory(tenantId, id);
  }

  @Get('products')
  products(
    @CurrentTenantId() tenantId: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.admin.listProducts(tenantId, categoryId);
  }

  @Post('products')
  createProduct(@CurrentTenantId() tenantId: string, @Body() body: ProductDto) {
    return this.admin.createProduct(tenantId, body);
  }

  @Patch('products/:id')
  updateProduct(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body()
    body: Partial<ProductDto> & {
      isActive?: boolean;
      isAvailable?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.admin.updateProduct(tenantId, id, body);
  }

  @Delete('products/:id')
  deleteProduct(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.admin.deleteProduct(tenantId, id);
  }

  @Get('addons')
  addons(@CurrentTenantId() tenantId: string) {
    return this.admin.listAddons(tenantId);
  }

  @Post('addons')
  createAddon(@CurrentTenantId() tenantId: string, @Body() body: AddonDto) {
    return this.admin.createAddon(tenantId, body);
  }

  @Patch('addons/:id')
  updateAddon(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: Partial<AddonDto> & { isActive?: boolean },
  ) {
    return this.admin.updateAddon(tenantId, id, body);
  }

  @Delete('addons/:id')
  deleteAddon(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.admin.deleteAddon(tenantId, id);
  }

  @Get('combos')
  combos(@CurrentTenantId() tenantId: string) {
    return this.admin.listCombos(tenantId);
  }

  @Post('combos')
  createCombo(@CurrentTenantId() tenantId: string, @Body() body: ComboDto) {
    return this.admin.createCombo(tenantId, body);
  }

  @Patch('combos/:id')
  updateCombo(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: Partial<ComboDto> & { isActive?: boolean },
  ) {
    return this.admin.updateCombo(tenantId, id, body);
  }

  @Delete('combos/:id')
  deleteCombo(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.admin.deleteCombo(tenantId, id);
  }
}
