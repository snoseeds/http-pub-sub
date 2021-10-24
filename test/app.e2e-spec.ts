import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/')
      .expect(200)

    expect(body).toEqual(
      {
        "status": "success",
        "statusCode": 200,
        "message": "Welcome to Version 1.0.0 of HTTP BASED TOPIC PUB SUB Service",
        "data": "Please note the structure of this response as the structure for all response bodies in this domain's endpoints"
      }
    )
  })
});
