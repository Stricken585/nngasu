import { Module } from '@nestjs/common';
import { DisciplinesModule } from '../disciplines/disciplines.module.js';
import { AttendanceController } from './attendance.controller.js';
import { AttendanceService } from './attendance.service.js';

@Module({
  imports: [DisciplinesModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
