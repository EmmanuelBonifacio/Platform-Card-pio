import { Module } from '@nestjs/common';
import { CreditsService } from '../billing/credits/credits.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, CreditsService],
  exports: [OrdersService, CreditsService],
})
export class OrdersModule {}
