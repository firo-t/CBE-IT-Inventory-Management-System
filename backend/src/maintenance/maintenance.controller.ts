import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceRequestDto, UpdateMaintenanceRequestDto, UpdateMaintenanceStatusDto, AssignTechnicianDto, CreateMaintenanceRecordDto, MaintenanceQueryDto } from './dto/maintenance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager')
  @Post('requests')
  createRequest(@Body() createDto: CreateMaintenanceRequestDto, @CurrentUser() user: any) {
    return this.maintenanceService.createRequest(createDto, user);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get('requests')
  findAllRequests(@Query() query: MaintenanceQueryDto, @CurrentUser() user: any) {
    return this.maintenanceService.findAllRequests(query, user);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get('requests/:id')
  findOneRequest(@Param('id') id: string, @CurrentUser() user: any) {
    return this.maintenanceService.findOneRequest(id, user);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager')
  @Patch('requests/:id')
  updateRequest(@Param('id') id: string, @Body() updateDto: UpdateMaintenanceRequestDto, @CurrentUser() user: any) {
    return this.maintenanceService.updateRequest(id, updateDto, user);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Hardware Technician')
  @Patch('requests/:id/status')
  updateStatus(@Param('id') id: string, @Body() statusDto: UpdateMaintenanceStatusDto, @CurrentUser() user: any) {
    return this.maintenanceService.updateStatus(id, statusDto, user);
  }

  @Roles('System Administrator / Admin', 'Hardware Technician')
  @Post('requests/:id/records')
  createRecord(@Param('id') id: string, @Body() recordDto: CreateMaintenanceRecordDto, @CurrentUser() user: any) {
    return this.maintenanceService.createRecord(id, recordDto, user);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Post('requests/:id/assign')
  assignTechnician(@Param('id') id: string, @Body() assignDto: AssignTechnicianDto, @CurrentUser() user: any) {
    return this.maintenanceService.assignTechnician(id, assignDto, user);
  }
}
