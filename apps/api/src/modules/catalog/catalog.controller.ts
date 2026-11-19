import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentTenantId } from '../../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CatalogService } from './catalog.service';

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('public/:tenantSlug/menu')
  publicMenu(@Param('tenantSlug') slug: string) {
    return this.catalog.publicMenu(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get('catalog/search')
  search(
    @CurrentTenantId() tenantId: string,
    @Query('q') q = '',
  ) {
    return this.catalog.search(tenantId, q);
  }
}
