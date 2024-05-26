import { Test, TestingModule } from '@nestjs/testing';
import { BullQueueService } from './bull-queue.service';

describe('BullQueueService', () => {
  let service: BullQueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BullQueueService],
    }).compile();

    service = module.get<BullQueueService>(BullQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
