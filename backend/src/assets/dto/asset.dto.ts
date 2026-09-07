import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { AssetStatus } from '@prisma/client';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  tag_no: string;

  @IsString()
  @IsOptional()
  serial_no?: string;

  @IsUUID()
  @IsNotEmpty()
  asset_type_id: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  ws_no?: string;

  @IsString()
  @IsOptional()
  condition?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @IsUUID()
  @IsOptional()
  current_branch_id?: string;
}

export class UpdateAssetDto {
  @IsString()
  @IsOptional()
  tag_no?: string;

  @IsString()
  @IsOptional()
  serial_no?: string;

  @IsUUID()
  @IsOptional()
  asset_type_id?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  ws_no?: string;

  @IsString()
  @IsOptional()
  condition?: string;

  @IsString()
  @IsOptional()
  description?: string;

  // We explicitly omit status and current_branch_id here as per business rules
  // Status transitions should be handled by future workflows (Assignment/Dispatch/Maintenance)
}

export class AssetQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  tag_no?: string;

  @IsString()
  @IsOptional()
  serial_no?: string;

  @IsUUID()
  @IsOptional()
  asset_type_id?: string;

  @IsUUID()
  @IsOptional()
  current_branch_id?: string;

  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @IsString()
  @IsOptional()
  condition?: string;
}

export class UpdateAssetStatusDto {
  @IsEnum([
    AssetStatus.DAMAGED,
    AssetStatus.LOST,
    AssetStatus.RETIRED,
    AssetStatus.DISPOSED,
  ], {
    message: 'Status must be one of: DAMAGED, LOST, RETIRED, DISPOSED',
  })
  status: AssetStatus;
}

