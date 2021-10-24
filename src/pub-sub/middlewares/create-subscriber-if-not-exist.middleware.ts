import { Injectable, NestMiddleware, Res, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response, NextFunction } from 'express';
import { SubscriberRepository } from '../../repository/subscriber.repository';
import { Subscriber } from '../../domain/model/subscriber.entity';
import { SubscribeRequestDto } from '../../domain/dto/subscribe.request.dto';
  
@Injectable()
export class CreateSubscriberIfNotExistMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(SubscriberRepository) private readonly subscriberRepo: SubscriberRepository
  ){}
  
  async use(req: Request, @Res() res: Response, next: NextFunction) {
    try {
      const { url } = req.body;

      try {
        const subscriber: Subscriber = await this.subscriberRepo.findByWebHook(url);
        req.body.subscriber = subscriber || await this.subscriberRepo.createNewSubscriber(url);
        req.body.subscriberStatus = subscriber ? "Existing subscriber" : "Newly created subscriber";

        return next();
      } catch (err) {
        return next(err);
      }
    } catch(err) {
      return next(err);
    }
  }
}
