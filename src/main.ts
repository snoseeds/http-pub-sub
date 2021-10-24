import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PubSubController } from '../src/pub-sub/pub-sub.controller'
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3600);
  console.log('app listening on port 3600')
}
bootstrap();
