import { IsBoolean, IsOptional } from 'class-validator';

export abstract class JsendBaseConfigRequestDto {
  @IsBoolean()
  @IsOptional()
  useConsistentJsendResp: boolean = true;
}