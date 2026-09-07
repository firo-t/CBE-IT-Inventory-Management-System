import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAssetTypeDto {
  @IsString()
  @IsNotEmpty()
  type_name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateAssetTypeDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  type_name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
