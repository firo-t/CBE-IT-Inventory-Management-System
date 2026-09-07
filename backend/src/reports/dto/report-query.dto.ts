import { IsString, IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { AssetStatus, AssignmentStatus, DispatchStatus, MaintenanceStatus, MaintenancePriority } from '@prisma/client';

export class BaseReportQueryDto {
  @IsUUID()
  @IsOptional()
  branch_id?: string;

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;
}

export class InventoryReportQueryDto extends BaseReportQueryDto {
  @IsUUID()
  @IsOptional()
  asset_type_id?: string;

  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @IsString()
  @IsOptional()
  condition?: string;
}

export class AssignmentReportQueryDto extends BaseReportQueryDto {
  @IsEnum(AssignmentStatus)
  @IsOptional()
  status?: AssignmentStatus;
}

export class DispatchReportQueryDto extends BaseReportQueryDto {
  @IsUUID()
  @IsOptional()
  source_branch_id?: string;

  @IsUUID()
  @IsOptional()
  destination_branch_id?: string;

  @IsEnum(DispatchStatus)
  @IsOptional()
  status?: DispatchStatus;
}

export class MaintenanceReportQueryDto extends BaseReportQueryDto {
  @IsEnum(MaintenancePriority)
  @IsOptional()
  priority?: MaintenancePriority;

  @IsEnum(MaintenanceStatus)
  @IsOptional()
  status?: MaintenanceStatus;

  @IsUUID()
  @IsOptional()
  technician_id?: string;
}
