import { OrderStatus } from '@prisma/client';
import { CreditsService } from '../billing/credits/credits.service';
import { OrdersService } from './orders.service';

describe('OrdersService.accept — débito só no aceite', () => {
  it('debita crédito e marca creditDebited=true', async () => {
    const order = {
      id: 'ord-1',
      tenantId: 'ten-1',
      status: OrderStatus.PENDING,
      creditDebited: false,
    };

    const tx = {
      order: {
        findFirst: jest.fn().mockResolvedValue({
          ...order,
          customerId: 'cust-1',
          totalCents: 1000,
          number: 7,
          customer: { phone: '5534999' },
        }),
        update: jest.fn().mockImplementation(({ data }: { data: object }) => ({
          ...order,
          totalCents: 1000,
          number: 7,
          ...data,
        })),
      },
      creditCycle: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      auditLog: { create: jest.fn() },
    };

    const prisma = {
      $transaction: jest.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
    };

    const credits = {
      assertCanAcceptOrder: jest.fn().mockResolvedValue({
        mode: 'cycle',
        cycleId: 'cycle-1',
      }),
      debitOne: jest.fn().mockResolvedValue(true),
    };

    const crm = { onOrderAccepted: jest.fn() };
    const whatsapp = { notifyOrderAccepted: jest.fn() };
    const marketing = { validateCoupon: jest.fn() };
    const service = new OrdersService(
      prisma as never,
      credits as unknown as CreditsService,
      crm as never,
      whatsapp as never,
      marketing as never,
    );

    const result = await service.accept('ten-1', 'ord-1', 'user-1');

    expect(credits.debitOne).toHaveBeenCalledWith(tx, 'cycle-1');
    expect(result.status).toBe(OrderStatus.ACCEPTED);
    expect(result.creditDebited).toBe(true);
    expect(tx.auditLog.create).toHaveBeenCalled();
  });

  it('rejeitar não chama debitOne', async () => {
    const prisma = {
      order: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'ord-1',
          tenantId: 'ten-1',
          status: OrderStatus.PENDING,
        }),
        update: jest.fn().mockResolvedValue({
          id: 'ord-1',
          status: OrderStatus.REJECTED,
        }),
      },
    };
    const credits = { debitOne: jest.fn() };
    const service = new OrdersService(
      prisma as never,
      credits as unknown as CreditsService,
      { onOrderAccepted: jest.fn() } as never,
      { notifyOrderAccepted: jest.fn() } as never,
      { validateCoupon: jest.fn() } as never,
    );

    await service.reject('ten-1', 'ord-1', 'sem estoque');
    expect(credits.debitOne).not.toHaveBeenCalled();
  });
});

