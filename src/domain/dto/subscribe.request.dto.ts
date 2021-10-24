import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { JsendBaseConfigRequestDto } from './jsend-base-config.request.dto';

export class SubscribeRequestDto extends JsendBaseConfigRequestDto {

  @IsString()
  @IsNotEmpty()
  @IsUrl({
    require_protocol: true,
    require_tld: false
  })
  url: string;
}