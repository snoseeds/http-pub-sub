import { Module, NestModule, RequestMethod, MiddlewareConsumer, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configService } from './config/config.service';
import { PubSubController } from './pub-sub/pub-sub.controller';
import { PubSubService } from './pub-sub/pub-sub.service';
import { ValidatePublishRequestDtoMiddleware } from './pub-sub/middlewares/validate-publish-request-dto.middleware'
import { ValidateSubscribeRequestDtoMiddleware } from '../src/pub-sub/middlewares/validate-subscribe-request-dto.middleware';
import { CreateSubscriberIfNotExistMiddleware } from '../src/pub-sub/middlewares/create-subscriber-if-not-exist.middleware';
import { CreateTopicIfNotExistMiddleware } from '../src/pub-sub/middlewares/create-topic-if-not-exist.middleware';
import { CreateSubscriptionIfNotExistMiddleware } from '../src/pub-sub/middlewares/create-subscription-if-not-exist.middleware';
import { LogEventMiddleware } from '../src/pub-sub/middlewares/log-event.middleware';
import { CheckIfEventExistsMiddleware } from '../src/pub-sub/middlewares/check-if-event-exists.middleware';
import { PubSubModule } from './pub-sub/pub-sub.module';
import { EventRepository } from '../src/repository/event.repository';
import { SubscriberRepository } from '../src/repository/subscriber.repository';
import { SubscriptionRepository } from '../src/repository/subscription.repository';
import { TopicRepository } from '../src/repository/topic.repository';
import { GetTopicSubscribersMiddleware } from './pub-sub/middlewares/get-topic-subscribers.middleware';


@Module({
  imports: [
    TypeOrmModule.forFeature([EventRepository, SubscriptionRepository, SubscriberRepository, TopicRepository]),
    TypeOrmModule.forRoot(configService.getTypeOrmConfig()),
    PubSubModule
  ],
  controllers: [AppController],
  providers: [AppService, PubSubService],
  exports: [PubSubService]
})
export class AppModule implements NestModule {
  /***  PubSubController Methods Start ****/
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ValidateSubscribeRequestDtoMiddleware, CreateSubscriberIfNotExistMiddleware, CreateTopicIfNotExistMiddleware, CreateSubscriptionIfNotExistMiddleware)
      .forRoutes({ path: 'subscribe/:topic', method: RequestMethod.POST });
      
    consumer
      .apply(ValidatePublishRequestDtoMiddleware, CreateTopicIfNotExistMiddleware, GetTopicSubscribersMiddleware, LogEventMiddleware)
      .forRoutes({ path: 'publish/:topic', method: RequestMethod.POST });

    consumer
      .apply(CheckIfEventExistsMiddleware)
      .forRoutes({ path: 'getEventStatus/:eventID', method: RequestMethod.GET });
  }
  /***  PubSubController Methods End ****/

}