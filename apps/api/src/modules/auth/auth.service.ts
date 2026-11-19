import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciais inválidas');
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  /**
   * SSO a partir do SaaS Platform: valida JWT assinado com shared secret
   * e emite token local do Platform Cardápio.
   */
  async loginFromSaasPlatform(payload: {
    saasUserId: string;
    saasTenantId: string;
    email: string;
    name: string;
  }) {
    let tenant = await this.prisma.tenant.findUnique({
      where: { saasTenantId: payload.saasTenantId },
    });
    if (!tenant) {
      throw new UnauthorizedException({
        code: 'SAAS_TENANT_NOT_LINKED',
        message:
          'Tenant do SaaS Platform ainda não provisionado no Platform Cardápio',
      });
    }

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { saasUserId: payload.saasUserId },
          { email: payload.email, tenantId: tenant.id },
        ],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: payload.email,
          name: payload.name,
          saasUserId: payload.saasUserId,
          role: 'TENANT_OWNER',
        },
      });
    } else if (!user.saasUserId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { saasUserId: payload.saasUserId },
      });
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      saasTenantId: tenant.saasTenantId,
    });

    return { accessToken, user, tenant };
  }
}
