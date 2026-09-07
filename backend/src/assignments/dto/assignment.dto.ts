import { IsString, IsNotEmpty, IsUUID, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { AssignmentStatus } from '@prisma/client';

export class CreateAssignmentDto {
  @IsUUID()
  @IsNotEmpty()
  asset_id: string;

  @IsString()
  @IsNotEmpty()
  employee_id: string;

  @IsString()
  @IsNotEmpty()
  employee_name: string;

  @IsUUID()
  @IsNotEmpty()
  branch_id: string;

  @IsDateString()
  @IsOptional()
  assigned_date?: string;
}

export class AssignmentQueryDto {
  @IsEnum(AssignmentStatus)
  @IsOptional()
  status?: AssignmentStatus;
}
