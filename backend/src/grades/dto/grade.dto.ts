import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';

const trimmed = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() || undefined : value);

// Запись журнала: оценка и/или примечание (статус, комментарий). Хотя бы одно
// из трёх обязательно — это проверяет сервис.
export class CreateGradeDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  disciplineId: string;

  // 5-балльная шкала с дробными значениями (3.5, 4.6), минимум — 0
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Оценка — число, не больше двух знаков после запятой' })
  @Min(0, { message: 'Оценка не может быть меньше 0' })
  @Max(5, { message: 'Оценка не может быть больше 5' })
  value?: number;

  // День занятия; по умолчанию — сегодня
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Дата в формате ГГГГ-ММ-ДД' })
  date?: string;

  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(60, { message: 'Статус не длиннее 60 символов' })
  status?: string;

  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(500, { message: 'Комментарий не длиннее 500 символов' })
  comment?: string;
}

// Для PATCH пустое значение (null / пустая строка) очищает поле.
const clearable = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() || null : value);

// Правка записи журнала: переданные поля заменяют старые. Дата и студент не меняются.
export class UpdateGradeDto {
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Оценка — число, не больше двух знаков после запятой' })
  @Min(0, { message: 'Оценка не может быть меньше 0' })
  @Max(5, { message: 'Оценка не может быть больше 5' })
  value?: number | null;

  @Transform(clearable)
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(60, { message: 'Статус не длиннее 60 символов' })
  status?: string | null;

  @Transform(clearable)
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(500, { message: 'Комментарий не длиннее 500 символов' })
  comment?: string | null;
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
