import { Request, Response, NextFunction } from 'express';
import { JSendResponseDto } from '../../domain/dto/jsend-response.dto';
import { Injectable, NestMiddleware, Res } from '@nestjs/common';

@Injectable()
export class ValidatePublishRequestDtoMiddleware implements NestMiddleware {
  constructor(
  ){}
  
  async use(req: Request, @Res() res: Response, next: NextFunction) {
    try {
      if (Object.keys(req.body).length == 0) {
        return res.status(400).send(new JSendResponseDto("failed", 400, "Event's body cannot be empty", null));
      }
      // Store the req.body now to preserve the original event data before adding more props to req object from using middlewares processing approach
      req.body.eventData = JSON.stringify(req.body);
      return next()
    } catch(err) {
      return next(err);
    }
  }
}

