import { IsOptional, IsString } from 'class-validator';

export class NotificationQueryDto {
  @IsOptional()
  @IsString()
  unread?: string;

  @IsOptional()
  @IsString()
  type?: string;
}
