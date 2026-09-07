import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AssetsService } from './assets.service';
import { CreateAssetDto, UpdateAssetDto, AssetQueryDto, UpdateAssetStatusDto } from './dto/asset.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Roles('System Administrator / Admin', 'IT Inventory Officer')
  @Post()
  create(@Body() createAssetDto: CreateAssetDto, @CurrentUser() user: any) {
    return this.assetsService.create(createAssetDto, user);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get()
  findAll(@Query() query: AssetQueryDto, @CurrentUser() user: any) {
    return this.assetsService.findAll(query);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssetDto: UpdateAssetDto, @CurrentUser() user: any) {
    return this.assetsService.update(id, updateAssetDto, user);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() updateAssetStatusDto: UpdateAssetStatusDto, @CurrentUser() user: any) {
    return this.assetsService.updateStatus(id, updateAssetStatusDto, user);
  }
}
