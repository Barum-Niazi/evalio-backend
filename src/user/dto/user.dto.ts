import { IsOptional, IsString, IsInt, IsJSON } from 'class-validator';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  profileBlobId?: number;

  @IsOptional()
  @IsString()
  newPassword?: string;

  @IsOptional()
  metadata?: any;
}
