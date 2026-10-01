import { Module } from '@nestjs/common';
import { DisciplinesModule } from '../disciplines/disciplines.module.js';
import { GroupsController } from './groups.controller.js';
import { GroupsService } from './groups.service.js';

@Module({
  imports: [DisciplinesModule],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
