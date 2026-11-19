import { CycleStatus } from '@prisma/client';
import { CreditsService } from './credits.service';

describe('CreditsService.debitOne', () => {
  it('retorna true quando updateMany afeta 1 linha', async () => {
    const tx = {
      creditCycle: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'cycle-id',
          status: CycleStatus.ACTIVE,
          consumed: 2,
          orderLimit: 100,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const service = new CreditsService({} as never);
    const ok = await service.debitOne(tx as never, 'cycle-id');
    expect(ok).toBe(true);
    expect(tx.creditCycle.updateMany).toHaveBeenCalled();
  });

  it('retorna false quando saldo esgotado', async () => {
    const tx = {
      creditCycle: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'cycle-id',
          status: CycleStatus.ACTIVE,
          consumed: 100,
          orderLimit: 100,
        }),
        updateMany: jest.fn(),
      },
    };
    const service = new CreditsService({} as never);
    const ok = await service.debitOne(tx as never, 'cycle-id');
    expect(ok).toBe(false);
    expect(tx.creditCycle.updateMany).not.toHaveBeenCalled();
  });
});
