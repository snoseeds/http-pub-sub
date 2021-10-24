import { Injectable, NestMiddleware, Res, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response, NextFunction } from 'express';
import { SubscriberRepository } from '../../repository/subscriber.repository';
import { TopicRepository } from '../../repository/topic.repository';
import { SubscriptionRepository } from '../../repository/subscription.repository';
import { Subscriber } from '../../domain/model/subscriber.entity';
import { Subscription } from '../../domain/model/subscription.entity';
import { Topic } from '../../domain/model/topic.entity';
import { Event } from '../../domain/model/event.entity';
import { JSendResponseDto } from '../../domain/dto/jsend-response.dto';
import { REQUEST } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';
import { SubscribeRequestDto } from '../../domain/dto/subscribe.request.dto';

  
@Injectable()
export class CreateTopicIfNotExistMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(TopicRepository) private readonly topicRepo: TopicRepository,
  ){}
  
  async use(req: Request, @Res() res: Response, next: NextFunction) {
    try {
      const { topic } = req.params;
      try {
        const topicResult: Topic = await this.topicRepo.findByName(topic);
        req.body.topicResult = topicResult || await this.topicRepo.createNewTopic(topic);
        req.body.topicStatus = topicResult ? "Existing topic" : "Newly created topic";

        return next();
      } catch (err) {
        // console.log(err);
        return next(err);
      }
    } catch(err) {
      return next(err);
    }
  }
}
































