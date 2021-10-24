import { Injectable, NestMiddleware, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response, NextFunction } from 'express';
import { SubscriberRepository } from '../../repository/subscriber.repository';
import { TopicRepository } from '../../repository/topic.repository';
import { SubscriptionRepository } from '../../repository/subscription.repository';
import { Subscriber } from '../../domain/model/subscriber.entity';
import { Subscription } from '../../domain/model/subscription.entity';
import { Topic } from '../../domain/model/topic.entity';
import { JSendResponseDto } from '../../domain/dto/jsend-response.dto';
import { PubSubService } from '../pub-sub.service';
  
@Injectable()
export class GetTopicSubscribersMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(SubscriberRepository) private readonly subscriberRepo: SubscriberRepository,
    @InjectRepository(TopicRepository) private readonly topicRepo: TopicRepository,
    @InjectRepository(SubscriptionRepository) private readonly subscriptionRepo: SubscriptionRepository,
    private readonly pubSubService: PubSubService
  ){}
  
  async use(req: Request, @Res() res: Response, next: NextFunction) {

    try {
      const topicResult: Topic = req.body.topicResult;
      const subscriptions: Subscription[] = await this.subscriptionRepo.findByTopicID(topicResult.id);
      req.body.listeners = subscriptions.map(subscription => subscription.subscriber.url);
      if (req.body.listeners.length > 0) {
        const updatedTopic = await this.topicRepo.incrementPublishedEventsCount(topicResult);
        req.body.topicResult = updatedTopic;
      }
      return next();
    } catch(err) {
      return next(err);
    }
  }
}
