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
import { OrderStatus, OrderType, Prisma, UserRole } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import {
  CurrentTenantId,
  CurrentUser,
} from '../../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { OrdersService } from './orders.service';

class CreateOrderDto {
  @IsEnum(OrderType)
  type!: OrderType;

  @IsArray()
  items!: Array<{
    productId?: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
    addons?: Array<{ name: string; priceCents: number }>;
  }>;

  @IsString()
  @MinLength(8)
  customerPhone!: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  addressJson?: Prisma.InputJsonValue;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  couponCode?: string;
}

class StatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  /** Cardápio público — cria pedido PENDING (sem débito). */
  @Post('public/:tenantSlug/orders')
  async createPublic(
    @Param('tenantSlug') slug: string,
    @Body() body: CreateOrderDto,
  ) {
    const tenantId = await this.orders.resolveTenantIdBySlug(slug);
    return this.orders.createPublic(tenantId, {
      type: body.type,
      items: body.items,
      notes: body.notes,
      addressJson: body.addressJson,
      customerPhone: body.customerPhone,
      customerName: body.customerName,
      source: body.source,
      couponCode: body.couponCode,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.TENANT_OWNER,
    UserRole.MANAGER,
    UserRole.OPERATOR,
    UserRole.KITCHEN,
  )
  @Get('orders')
  list(
    @CurrentTenantId() tenantId: string,
    @Query('status') status?: OrderStatus,
  ) {
    return this.orders.list(tenantId, status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER, UserRole.OPERATOR)
  @Post('orders/:id/accept')
  accept(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ) {
    return this.orders.accept(tenantId, id, user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER, UserRole.OPERATOR)
  @Post('orders/:id/reject')
  reject(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.orders.reject(tenantId, id, body.reason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.TENANT_OWNER,
    UserRole.MANAGER,
    UserRole.OPERATOR,
    UserRole.KITCHEN,
  )
  @Patch('orders/:id/status')
  updateStatus(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: StatusDto,
  ) {
    return this.orders.updateStatus(tenantId, id, body.status);
  }
}
