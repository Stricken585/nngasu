import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Role } from '@prisma/client';

export class ListUsersQuery {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsUUID()
  groupId?: string;
}
