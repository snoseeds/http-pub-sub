import { Injectable, NestMiddleware} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response, NextFunction } from 'express';
import { EventRepository } from '../../repository/event.repository';
import { Event } from '../../domain/model/event.entity';
import { EventStatus } from '../../domain/enum/event-status.enum';
  
@Injectable()
export class LogEventMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(EventRepository) private readonly eventRepo: EventRepository,
  ){}
  
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const createdEvent: Event = await this.eventRepo.createEvent(EventStatus.PROCESSING, req.body.eventData, req.body.topicResult, req.body.listeners.length);
      req.body.createdEvent = createdEvent;
      req.body.eventID = createdEvent.id;
      return next();
    } catch(err) {
      return next(err);
    }  
  }
}