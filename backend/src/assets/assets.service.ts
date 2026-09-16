import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto, UpdateAssetDto, AssetQueryDto, UpdateAssetStatusDto } from './dto/asset.dto';
import { Prisma, AssetStatus } from '@prisma/client';

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService, private auditLogsService: AuditLogsService) {}

  async create(createAssetDto: CreateAssetDto, user: any) {
    // 1. Check duplicate tag_no
    const existing = await this.prisma.asset.findUnique({
      where: { tag_no: createAssetDto.tag_no },
    });
    if (existing) {
      throw new ConflictException('Asset tag_no already exists');
    }

    // 2. Validate asset_type_id
    const assetType = await this.prisma.assetType.findUnique({
      where: { asset_type_id: createAssetDto.asset_type_id },
    });
    if (!assetType) {
      throw new NotFoundException('AssetType not found');
    }

    // 3. Validate current_branch_id if provided
    if (createAssetDto.current_branch_id) {
      const branch = await this.prisma.branch.findUnique({
        where: { branch_id: createAssetDto.current_branch_id },
      });
      if (!branch) {
        throw new NotFoundException('Branch not found');
      }
    }

    const asset = await this.prisma.asset.create({
      data: createAssetDto,
      include: {
        asset_type: true,
        current_branch: {
          include: {
            manager: {
              select: {
                user_id: true,
                full_name: true,
                employee_id: true,
                email: true,
                phone: true,
                status: true,
                role: true,
              }
            }
          }
        },
      }
    });

    await this.auditLogsService.createLog(this.prisma, {
      user_id: user.userId,
      action: 'CREATE',
      entity_type: 'ASSET',
      entity_id: asset.asset_id,
      new_value: { tag_no: asset.tag_no, serial_no: asset.serial_no, asset_type_id: asset.asset_type_id, current_branch_id: asset.current_branch_id }
    });

    return asset;
  }

  async findAll(query: AssetQueryDto, user?: any) {
    const { search, tag_no, serial_no, asset_type_id, current_branch_id, status, condition } = query;

    const where: Prisma.AssetWhereInput = {};

    if (user && user.role === 'Branch Manager' && user.branchId) {
      where.current_branch_id = user.branchId;
    } else if (current_branch_id) {
      where.current_branch_id = current_branch_id;
    }

    if (tag_no) where.tag_no = tag_no;
    if (serial_no) where.serial_no = serial_no;
    if (asset_type_id) where.asset_type_id = asset_type_id;
    if (status) where.status = status;
    if (condition) where.condition = condition;

    if (search) {
      where.OR = [
        { tag_no: { contains: search, mode: 'insensitive' } },
        { serial_no: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { ws_no: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.asset.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        asset_type: true,
        current_branch: {
          include: {
            manager: {
              select: {
                user_id: true,
                full_name: true,
                employee_id: true,
                email: true,
                phone: true,
                status: true,
                role: true,
              }
            }
          }
        },
      }
    });
  }

  async findOne(id: string, user?: any) {
    const asset = await this.prisma.asset.findUnique({
      where: { asset_id: id },
      include: {
        asset_type: true,
        current_branch: {
          include: {
            manager: {
              select: {
                user_id: true,
                full_name: true,
                employee_id: true,
                email: true,
                phone: true,
                status: true,
                role: true,
              }
            }
          }
        },
      }
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    if (user && user.role === 'Branch Manager' && user.branchId && asset.current_branch_id !== user.branchId) {
      const { ForbiddenException } = require('@nestjs/common');
      throw new ForbiddenException('Branch Managers can only view assets in their own branch');
    }

    return asset;
  }

  async update(id: string, updateAssetDto: UpdateAssetDto, user: any) {
    // 1. Verify existence
    const previous = await this.findOne(id);

    // 2. Verify duplicate tag_no if being updated
    if (updateAssetDto.tag_no) {
      const existing = await this.prisma.asset.findUnique({
        where: { tag_no: updateAssetDto.tag_no },
      });
      if (existing && existing.asset_id !== id) {
        throw new ConflictException('Asset tag_no already exists');
      }
    }

    // 3. Verify asset_type_id if being updated
    if (updateAssetDto.asset_type_id) {
      const assetType = await this.prisma.assetType.findUnique({
        where: { asset_type_id: updateAssetDto.asset_type_id },
      });
      if (!assetType) {
        throw new NotFoundException('AssetType not found');
      }
    }

    const asset = await this.prisma.asset.update({
      where: { asset_id: id },
      data: updateAssetDto,
      include: {
        asset_type: true,
        current_branch: {
          include: {
            manager: {
              select: {
                user_id: true,
                full_name: true,
                employee_id: true,
                email: true,
                phone: true,
                status: true,
                role: true,
              }
            }
          }
        },
      }
    });

    await this.auditLogsService.createLog(this.prisma, {
      user_id: user.userId,
      action: 'UPDATE',
      entity_type: 'ASSET',
      entity_id: id,
      previous_value: { tag_no: previous.tag_no, serial_no: previous.serial_no, asset_type_id: previous.asset_type_id, current_branch_id: previous.current_branch_id, status: previous.status, condition: previous.condition },
      new_value: { tag_no: asset.tag_no, serial_no: asset.serial_no, asset_type_id: asset.asset_type_id, current_branch_id: asset.current_branch_id, status: asset.status, condition: asset.condition }
    });

    return asset;
  }

  async updateStatus(id: string, updateAssetStatusDto: UpdateAssetStatusDto, user: any) {
    const allowedManualStatuses: AssetStatus[] = [
      AssetStatus.DAMAGED,
      AssetStatus.LOST,
      AssetStatus.RETIRED,
      AssetStatus.DISPOSED
    ];

    if (!allowedManualStatuses.includes(updateAssetStatusDto.status as AssetStatus)) {
      throw new BadRequestException(`Status '${updateAssetStatusDto.status}' cannot be set manually. It is controlled by business workflows.`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Verify existence
      const previous = await tx.asset.findUnique({
        where: { asset_id: id },
        include: {
          asset_type: true,
          current_branch: {
            include: {
              manager: {
                select: {
                  user_id: true,
                  full_name: true,
                  employee_id: true,
                  email: true,
                  phone: true,
                  status: true,
                  role: true,
                }
              }
            }
          },
        }
      });

      if (!previous) {
        throw new NotFoundException('Asset not found');
      }

      // 2. Perform the update
      const asset = await tx.asset.update({
        where: { asset_id: id },
        data: { status: updateAssetStatusDto.status },
        include: {
          asset_type: true,
          current_branch: {
            include: {
              manager: {
                select: {
                  user_id: true,
                  full_name: true,
                  employee_id: true,
                  email: true,
                  phone: true,
                  status: true,
                  role: true,
                }
              }
            }
          },
        }
      });

      // 3. Create AuditLog
      await this.auditLogsService.createLog(tx, {
        user_id: user.userId,
        action: 'UPDATE',
        entity_type: 'ASSET',
        entity_id: id,
        previous_value: { status: previous.status },
        new_value: { status: asset.status }
      });

      return asset;
    });
  }
}
