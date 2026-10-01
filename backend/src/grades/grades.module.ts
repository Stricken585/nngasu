import { Module } from '@nestjs/common';
import { DisciplinesModule } from '../disciplines/disciplines.module.js';
import { GradesController } from './grades.controller.js';
import { GradesService } from './grades.service.js';

@Module({
  imports: [DisciplinesModule],
  controllers: [GradesController],
  providers: [GradesService],
})
export class GradesModule {}
