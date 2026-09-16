import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto, UpdateUserStatusDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('System Administrator / Admin')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto, @CurrentUser() user: any) {
    return this.usersService.create(createUserDto, user);
  }

  @Roles('System Administrator / Admin', 'Branch Manager', 'IT Inventory Officer')
  @Get()
  findAll(
    @Query('search') search: string | undefined, 
    @Query('role') role: string | undefined,
    @CurrentUser() user: any
  ) {
    return this.usersService.findAll(search, role, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.findOne(id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @CurrentUser() user: any) {
    return this.usersService.update(id, updateUserDto, user);
  }

  @Patch(':id/password')
  changePassword(@Param('id') id: string, @Body() changePasswordDto: ChangePasswordDto, @CurrentUser() user: any) {
    return this.usersService.changePassword(id, changePasswordDto, user);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateUserStatusDto, @CurrentUser() user: any) {
    return this.usersService.updateStatus(id, updateStatusDto, user);
  }
}
