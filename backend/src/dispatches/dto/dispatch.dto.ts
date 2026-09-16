import { IsString, IsNotEmpty, IsUUID, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { DispatchStatus } from '@prisma/client';

export class CreateDispatchDto {
  @IsUUID()
  @IsNotEmpty()
  asset_id: string;

  @IsString()
  @IsNotEmpty()
  source_location: string;

  @IsUUID()
  @IsNotEmpty()
  destination_branch_id: string;

  @IsString()
  @IsNotEmpty()
  receiver_name: string;

  @IsString()
  @IsNotEmpty()
  receiver_id: string;

  @IsString()
  @IsNotEmpty()
  receiver_phone: string;

  @IsDateString()
  @IsOptional()
  dispatched_date?: string;
}

export class DispatchQueryDto {
  @IsEnum(DispatchStatus)
  @IsOptional()
  status?: DispatchStatus;

  @IsString()
  @IsOptional()
  search?: string;
}
