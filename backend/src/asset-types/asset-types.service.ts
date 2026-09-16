import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetTypeDto, UpdateAssetTypeDto } from './dto/asset-type.dto';

@Injectable()
export class AssetTypesService {
  constructor(private prisma: PrismaService, private auditLogsService: AuditLogsService) {}

  async create(createAssetTypeDto: CreateAssetTypeDto, user: any) {
    const existing = await this.prisma.assetType.findUnique({
      where: { type_name: createAssetTypeDto.type_name },
    });

    if (existing) {
      throw new ConflictException('Asset type name already exists');
    }

    const assetType = await this.prisma.assetType.create({
      data: createAssetTypeDto,
    });

    await this.auditLogsService.createLog(this.prisma, {
      user_id: user.userId,
      action: 'CREATE',
      entity_type: 'ASSET_TYPE',
      entity_id: assetType.asset_type_id,
      new_value: { type_name: assetType.type_name, description: assetType.description }
    });

    return assetType;
  }

  async findAll(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { type_name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.assetType.findMany({ where });
  }

  async findOne(id: string) {
    const assetType = await this.prisma.assetType.findUnique({
      where: { asset_type_id: id },
    });

    if (!assetType) {
      throw new NotFoundException('Asset type not found');
    }

    return assetType;
  }

  async update(id: string, updateAssetTypeDto: UpdateAssetTypeDto, user: any) {
    const previous = await this.findOne(id);

    if (updateAssetTypeDto.type_name) {
      const existing = await this.prisma.assetType.findUnique({
        where: { type_name: updateAssetTypeDto.type_name },
      });

      if (existing && existing.asset_type_id !== id) {
        throw new ConflictException('Asset type name already exists');
      }
    }

    const assetType = await this.prisma.assetType.update({
      where: { asset_type_id: id },
      data: updateAssetTypeDto,
    });

    await this.auditLogsService.createLog(this.prisma, {
      user_id: user.userId,
      action: 'UPDATE',
      entity_type: 'ASSET_TYPE',
      entity_id: id,
      previous_value: { type_name: previous.type_name, description: previous.description },
      new_value: { type_name: assetType.type_name, description: assetType.description }
    });

    return assetType;
  }
}
