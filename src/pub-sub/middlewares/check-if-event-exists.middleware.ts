import { Injectable, NestMiddleware} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response, NextFunction } from 'express';
import { EventRepository } from '../../repository/event.repository';
import { Event } from '../../domain/model/event.entity';
import { JSendResponseDto } from '../../domain/dto/jsend-response.dto';
  
@Injectable()
export class CheckIfEventExistsMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(EventRepository) private readonly eventRepo: EventRepository,
  ){}
  
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const eventResult: Event = await this.eventRepo.findOne(req.params.eventID);
      if (!eventResult) {
        return res.status(404).send(new JSendResponseDto(
          "failed",
          404,
          `The event with id '${req.params.eventID}' does not exist on this platform`,
          null
        ));
      }
      req.body.eventResult = eventResult;
      return next();
    } catch(err) {
      return res.status(404).send(new JSendResponseDto(
        "failed",
        404,
        `The event with id '${req.params.eventID}' does not exist on this platform`,
        null
      ));
    }  
  }
}
