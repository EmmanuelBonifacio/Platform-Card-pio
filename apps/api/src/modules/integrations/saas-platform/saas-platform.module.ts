import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { SaasPlatformController } from './saas-platform.controller';
import { SaasPlatformService } from './saas-platform.service';

@Module({
  imports: [AuthModule],
  controllers: [SaasPlatformController],
  providers: [SaasPlatformService],
  exports: [SaasPlatformService],
})
export class SaasPlatformModule {}
