import { CreditsService } from './credits.service';

describe('CreditsService.debitOne', () => {
  it('retorna true quando UPDATE afeta 1 linha', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
    };
    const service = new CreditsService({} as never);
    const ok = await service.debitOne(tx as never, 'cycle-id');
    expect(ok).toBe(true);
    expect(tx.$executeRaw).toHaveBeenCalled();
  });

  it('retorna false quando não há saldo (0 rows)', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(0),
    };
    const service = new CreditsService({} as never);
    const ok = await service.debitOne(tx as never, 'cycle-id');
    expect(ok).toBe(false);
  });
});
