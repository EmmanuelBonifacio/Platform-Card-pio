import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { IsBoolean } from 'class-validator';
import { CurrentTenantId } from '../../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { PrivacyService } from './privacy.service';

class ConsentDto {
  @IsBoolean() marketingOptIn!: boolean;
}

@Controller('privacy')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TENANT_OWNER, UserRole.MANAGER, UserRole.SUPPORT)
export class PrivacyController {
  constructor(private readonly privacy: PrivacyService) {}

  @Get('customers/:id/export')
  export(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.privacy.exportCustomer(tenantId, id);
  }

  @Post('customers/:id/anonymize')
  anonymize(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.privacy.anonymizeCustomer(tenantId, id);
  }

  @Post('customers/:id/consent')
  consent(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: ConsentDto,
  ) {
    return this.privacy.consent(tenantId, id, body.marketingOptIn);
  }
}
