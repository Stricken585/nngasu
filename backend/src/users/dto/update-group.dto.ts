import { IsUUID, ValidateIf } from 'class-validator';

export class UpdateGroupDto {
  // null — снять студента с группы
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  groupId: string | null;
}
