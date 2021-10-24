import { Test, TestingModule } from '@nestjs/testing';
import { PubSubController } from './pub-sub.controller';

describe('PubSubController', () => {
  let controller: PubSubController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PubSubController],
    }).compile();

    controller = module.get<PubSubController>(PubSubController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
