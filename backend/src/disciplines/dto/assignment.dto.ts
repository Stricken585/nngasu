import { IsOptional, IsUUID } from 'class-validator';

export class CreateAssignmentDto {
  @IsUUID()
  teacherId: string;

  @IsUUID()
  disciplineId: string;

  @IsUUID()
  groupId: string;
}

export class ListAssignmentsQuery {
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @IsOptional()
  @IsUUID()
  disciplineId?: string;

  @IsOptional()
  @IsUUID()
  groupId?: string;
}
