import {
  Body,
  Controller,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import type { SaasProvisionPayload } from './saas-platform.service';
import { SaasPlatformService } from './saas-platform.service';

@Controller('integrations/saas-platform')
export class SaasPlatformController {
  constructor(private readonly saas: SaasPlatformService) {}

  @Post('webhooks/provision')
  async provision(
    @Req() req: { rawBody?: Buffer },
    @Headers('x-saas-signature') signature: string | undefined,
    @Body() body: SaasProvisionPayload,
  ) {
    const raw =
      req.rawBody ??
      Buffer.from(JSON.stringify(body));
    this.saas.verifyWebhookSignature(raw, signature);
    return this.saas.provisionTenant(body);
  }

  @Post('sso')
  sso(
    @Body()
    body: {
      saasUserId: string;
      saasTenantId: string;
      email: string;
      name: string;
      signature: string;
      timestamp: number;
    },
  ) {
    return this.saas.ssoExchange(body);
  }
}
