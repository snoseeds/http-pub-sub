import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { JSendResponseDto } from './domain/dto/jsend-response.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): JSendResponseDto<string> {
    return this.appService.home();
  }
}
