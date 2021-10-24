import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the object below', () => {
      expect(appController.getHello()).toEqual(
        {
          "status": "success",
          "statusCode": 200,
          "message": "Welcome to Version 1.0.0 of HTTP BASED TOPIC PUB SUB Service",
          "data": "Please note the structure of this response as the structure for all response bodies in this domain's endpoints"
        }
      )
    });
  });
});
