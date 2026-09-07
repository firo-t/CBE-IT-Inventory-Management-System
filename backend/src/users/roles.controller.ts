import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('System Administrator / Admin')
@Controller('roles')
export class RolesController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getRoles() {
    return this.usersService.getRoles();
  }
}
