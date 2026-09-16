import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AssetTypesService } from './asset-types.service';
import { CreateAssetTypeDto, UpdateAssetTypeDto } from './dto/asset-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('System Administrator / Admin')
@Controller('asset-types')
export class AssetTypesController {
  constructor(private readonly assetTypesService: AssetTypesService) {}

  @Post()
  create(@Body() createAssetTypeDto: CreateAssetTypeDto, @CurrentUser() user: any) {
    return this.assetTypesService.create(createAssetTypeDto, user);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager')
  @Get()
  findAll(@Query('search') search?: string) {
    return this.assetTypesService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetTypesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssetTypeDto: UpdateAssetTypeDto, @CurrentUser() user: any) {
    return this.assetTypesService.update(id, updateAssetTypeDto, user);
  }
}
