import { Module } from '@nestjs/common';
import { AssignmentsController } from './assignments.controller.js';
import { AssignmentsService } from './assignments.service.js';
import { DisciplinesController } from './disciplines.controller.js';
import { DisciplinesService } from './disciplines.service.js';

@Module({
  controllers: [DisciplinesController, AssignmentsController],
  providers: [DisciplinesService, AssignmentsService],
  exports: [AssignmentsService],
})
export class DisciplinesModule {}
