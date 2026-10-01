import { PartialType } from '@nestjs/mapped-types';
import { DayOfWeek, LessonType, WeekParity } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';
import { MAX_PAIR, MIN_PAIR } from '../pair-times.constant.js';

export class CreateScheduleEntryDto {
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @IsEnum(WeekParity)
  weekParity: WeekParity;

  @IsInt()
  @Min(MIN_PAIR)
  @Max(MAX_PAIR)
  pairNumber: number;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  room: string;

  @IsEnum(LessonType)
  lessonType: LessonType;

  @IsUUID()
  disciplineId: string;

  @IsUUID()
  teacherId: string;

  @IsUUID()
  groupId: string;
}

export class UpdateScheduleEntryDto extends PartialType(CreateScheduleEntryDto) {}

export class ScheduleQuery {
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @IsOptional()
  @IsEnum(WeekParity)
  weekParity?: WeekParity;
}
