import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { CreditsService } from './credits/credits.service';

@Module({
  controllers: [BillingController],
  providers: [BillingService, CreditsService],
  exports: [BillingService, CreditsService],
})
export class BillingModule {}
