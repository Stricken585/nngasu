import { AttendanceStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID, Matches } from 'class-validator';

export class CreateAbsenceDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  disciplineId: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Дата в формате ГГГГ-ММ-ДД' })
  date: string;

  // «н» по умолчанию; повторная отметка на тот же день меняет статус («н» ↔ «б»)
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;
}

export class ListAttendanceQuery {
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsUUID()
  groupId?: string;

  @IsOptional()
  @IsUUID()
  disciplineId?: string;
}
