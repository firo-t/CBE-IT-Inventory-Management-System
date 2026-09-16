import { IsString, IsNotEmpty, IsUUID, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { MaintenancePriority, MaintenanceStatus } from '@prisma/client';

export class CreateMaintenanceRequestDto {
  @IsUUID()
  @IsNotEmpty()
  asset_id: string;

  @IsString()
  @IsNotEmpty()
  problem_description: string;

  @IsEnum(MaintenancePriority)
  @IsOptional()
  priority?: MaintenancePriority;
}

export class UpdateMaintenanceRequestDto {
  @IsString()
  @IsOptional()
  problem_description?: string;

  @IsEnum(MaintenancePriority)
  @IsOptional()
  priority?: MaintenancePriority;
}

export class UpdateMaintenanceStatusDto {
  @IsEnum(MaintenanceStatus)
  @IsNotEmpty()
  status: MaintenanceStatus;
}

export class AssignTechnicianDto {
  @IsUUID()
  @IsOptional()
  technician_id?: string;
}

export class CreateMaintenanceRecordDto {
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @IsString()
  @IsOptional()
  repair_action?: string;

  @IsString()
  @IsOptional()
  parts_used?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  // This will update the Asset.condition
  @IsString()
  @IsOptional()
  condition?: string;

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsOptional()
  completion_date?: string;
}

export class MaintenanceQueryDto {
  @IsUUID()
  @IsOptional()
  asset_id?: string;

  @IsEnum(MaintenanceStatus)
  @IsOptional()
  status?: MaintenanceStatus;

  @IsEnum(MaintenancePriority)
  @IsOptional()
  priority?: MaintenancePriority;

  @IsString()
  @IsOptional()
  search?: string;
}
