import { IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CreateGradeDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  disciplineId: string;

  // 5-балльная шкала с дробными значениями (3.5, 4.6)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Оценка — число, не больше двух знаков после запятой' })
  @Min(1, { message: 'Оценка не может быть меньше 1' })
  @Max(5, { message: 'Оценка не может быть больше 5' })
  value: number;
}

export class ListGradesQuery {
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
