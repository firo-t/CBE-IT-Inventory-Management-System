import { IsUUID, IsOptional } from 'class-validator';

export class CreateAttachmentDto {
  @IsUUID()
  @IsOptional()
  asset_id?: string;

  @IsUUID()
  @IsOptional()
  maintenance_request_id?: string;
}

export class AttachmentQueryDto {
  @IsUUID()
  @IsOptional()
  asset_id?: string;

  @IsUUID()
  @IsOptional()
  maintenance_request_id?: string;
}
