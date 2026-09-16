import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { DispatchesService } from './dispatches.service';
import { CreateDispatchDto, DispatchQueryDto } from './dto/dispatch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dispatches')
export class DispatchesController {
  constructor(private readonly dispatchesService: DispatchesService) {}

  @Roles('System Administrator / Admin', 'IT Inventory Officer')
  @Post()
  create(@Body() createDispatchDto: CreateDispatchDto, @CurrentUser() user: any) {
    return this.dispatchesService.create(createDispatchDto, user);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get()
  findAll(@Query() query: DispatchQueryDto, @CurrentUser() user: any) {
    return this.dispatchesService.findAll(query, user);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.dispatchesService.findOne(id, user);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager')
  @Patch(':id/receive')
  receiveDispatch(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.dispatchesService.receiveDispatch(id, user);
  }
}
