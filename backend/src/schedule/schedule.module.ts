import { Module } from '@nestjs/common';
import { DisciplinesModule } from '../disciplines/disciplines.module.js';
import { ScheduleController } from './schedule.controller.js';
import { ScheduleService } from './schedule.service.js';

@Module({
  imports: [DisciplinesModule],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
