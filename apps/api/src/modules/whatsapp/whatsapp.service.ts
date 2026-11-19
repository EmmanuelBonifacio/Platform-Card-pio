import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Integração WhatsApp — fase canal.
 * Em produção: Meta Cloud API / Evolution. Aqui: config + fila de mensagens stub.
 */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getConfig(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        whatsappNumber: true,
        settings: true,
      },
    });
    const settings = (tenant?.settings ?? {}) as Record<string, unknown>;
    return {
      phone: tenant?.whatsappNumber ?? null,
      botEnabled: Boolean(settings.whatsappBotEnabled),
      welcomeMessage:
        (settings.whatsappWelcome as string) ||
        'Olá! Bem-vindo. Envie seu pedido pelo cardápio digital 🍽️',
      autoReplyEnabled: Boolean(settings.whatsappAutoReply ?? true),
    };
  }

  async updateConfig(
    tenantId: string,
    data: {
      phone?: string;
      botEnabled?: boolean;
      welcomeMessage?: string;
      autoReplyEnabled?: boolean;
    },
  ) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });
    const settings = {
      ...((tenant.settings ?? {}) as Record<string, unknown>),
      whatsappBotEnabled: data.botEnabled ?? false,
      whatsappWelcome: data.welcomeMessage,
      whatsappAutoReply: data.autoReplyEnabled ?? true,
    };
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        whatsappNumber: data.phone,
        settings,
      },
      select: { id: true, whatsappNumber: true, settings: true },
    });
  }

  /**
   * Webhook inbound stub — registra evento e responde com welcome se bot ativo.
   */
  async handleInbound(payload: {
    tenantSlug?: string;
    from: string;
    text?: string;
  }) {
    const eventKey = `wa.inbound.${payload.from}.${Date.now()}`;
    await this.prisma.integrationEvent.create({
      data: {
        source: 'whatsapp',
        eventKey,
        payload,
        status: 'processed',
        processedAt: new Date(),
      },
    });

    let reply: string | null = null;
    if (payload.tenantSlug) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: payload.tenantSlug },
      });
      if (tenant) {
        const cfg = await this.getConfig(tenant.id);
        if (cfg.botEnabled && cfg.autoReplyEnabled) {
          reply = cfg.welcomeMessage;
          this.logger.log(
            `WA auto-reply to ${payload.from}: ${reply?.slice(0, 40)}…`,
          );
        }
      }
    }

    return { ok: true, eventKey, reply };
  }

  async notifyOrderAccepted(tenantId: string, orderNumber: number, phone?: string | null) {
    if (!phone) return;
    const cfg = await this.getConfig(tenantId);
    if (!cfg.botEnabled) return;
    const text = `Pedido #${orderNumber} aceito! Já estamos preparando 🚀`;
    await this.prisma.integrationEvent.create({
      data: {
        source: 'whatsapp',
        eventKey: `wa.out.accept.${tenantId}.${orderNumber}.${Date.now()}`,
        payload: { to: phone, text, status: 'queued_stub' },
        status: 'processed',
        processedAt: new Date(),
      },
    });
    this.logger.log(`WA notify queued to ${phone}: ${text}`);
  }
}
