import { Module } from '@nestjs/common';
import {
  AffiliatesController,
  AffiliatesPublicController,
} from './affiliates.controller';
import { AffiliatesService } from './affiliates.service';

@Module({
  controllers: [AffiliatesController, AffiliatesPublicController],
  providers: [AffiliatesService],
  exports: [AffiliatesService],
})
export class AffiliatesModule {}
