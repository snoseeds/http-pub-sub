import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PubSubService } from './pub-sub.service';
import { PubSubController } from './pub-sub.controller';
import { EventRepository } from '../repository/event.repository';
import { SubscriberRepository } from '../repository/subscriber.repository';
import { SubscriptionRepository } from '../repository/subscription.repository';
import { TopicRepository } from '../repository/topic.repository';

@Module({
  imports: [TypeOrmModule.forFeature([EventRepository, SubscriptionRepository, SubscriberRepository, TopicRepository])],
  providers: [PubSubService],
  controllers: [PubSubController],
  exports: [PubSubService]
})

export class PubSubModule {}
