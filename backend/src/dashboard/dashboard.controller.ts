import { Controller, Get, UseGuards, ForbiddenException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Hardware Technician', 'Branch Manager')
  @Get()
  getDashboard(@CurrentUser() user: any) {
    if (user.role === 'Branch Manager' && !user.branchId) {
        throw new ForbiddenException('Branch Manager has no associated branch');
    }
    return this.dashboardService.getDashboardData(user);
  }
}
