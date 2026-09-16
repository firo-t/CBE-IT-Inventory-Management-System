import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto, AssignmentQueryDto } from './dto/assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Roles('System Administrator / Admin', 'IT Inventory Officer')
  @Post()
  create(
    @Body() createAssignmentDto: CreateAssignmentDto,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.create(createAssignmentDto, user);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get()
  findAll(@Query() query: AssignmentQueryDto, @CurrentUser() user: any) {
    return this.assignmentsService.findAll(query, user);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.assignmentsService.findOne(id, user);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer')
  @Patch(':id/return')
  returnAssignment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.assignmentsService.returnAssignment(id, user);
  }
}
