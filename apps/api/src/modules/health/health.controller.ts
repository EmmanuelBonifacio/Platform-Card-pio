import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'platform-cardapio-api',
      product: 'Platform Cardápio',
      architecture: 'FoodFlow AI',
      ts: new Date().toISOString(),
    };
  }
}
