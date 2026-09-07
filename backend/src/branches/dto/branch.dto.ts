import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  branch_code: string;

  @IsString()
  @IsNotEmpty()
  branch_name: string;

  @IsUUID()
  @IsOptional()
  manager_id?: string;

  @IsString()
  @IsOptional()
  contact_person?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  location?: string;
}

export class UpdateBranchDto {
  @IsString()
  @IsOptional()
  branch_code?: string;

  @IsString()
  @IsOptional()
  branch_name?: string;

  @IsUUID()
  @IsOptional()
  manager_id?: string | null;

  @IsString()
  @IsOptional()
  contact_person?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  location?: string;
}
