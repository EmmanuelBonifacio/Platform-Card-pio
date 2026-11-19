import { Module } from '@nestjs/common';
import { CreditsService } from '../billing/credits/credits.service';
import { CrmModule } from '../crm/crm.module';
import { MarketingModule } from '../marketing/marketing.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [CrmModule, WhatsappModule, MarketingModule],
  controllers: [OrdersController],
  providers: [OrdersService, CreditsService],
  exports: [OrdersService, CreditsService],
})
export class OrdersModule {}
