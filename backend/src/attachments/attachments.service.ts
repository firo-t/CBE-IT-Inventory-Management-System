import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Injectable, NotFoundException, BadRequestException, ForbiddenException, StreamableFile } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttachmentDto, AttachmentQueryDto } from './dto/attachment.dto';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AttachmentsService {
  constructor(private prisma: PrismaService, private auditLogsService: AuditLogsService) {}

  async create(file: Express.Multer.File, createDto: CreateAttachmentDto, user: any) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!createDto.asset_id && !createDto.maintenance_request_id) {
      // Clean up the uploaded file if we reject it
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new BadRequestException('Attachment must be associated with an asset or a maintenance request');
    }

    let branchIdContext = null;

    // Validate relations
    if (createDto.asset_id) {
      const asset = await this.prisma.asset.findUnique({ where: { asset_id: createDto.asset_id } });
      if (!asset) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        throw new NotFoundException('Associated asset not found');
      }
      branchIdContext = asset.current_branch_id;
    }

    if (createDto.maintenance_request_id) {
      const mr = await this.prisma.maintenanceRequest.findUnique({ where: { request_id: createDto.maintenance_request_id } });
      if (!mr) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        throw new NotFoundException('Associated maintenance request not found');
      }
      branchIdContext = mr.branch_id;
    }

    // Branch Manager scope
    if (user.role === 'Branch Manager' && user.branchId !== branchIdContext) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new ForbiddenException('Branch Managers can only attach files to their own branch workflows');
    }

    const att = await this.prisma.attachment.create({
      data: {
        asset_id: createDto.asset_id,
        maintenance_request_id: createDto.maintenance_request_id,
        file_name: file.originalname,
        file_path: file.filename, // Store just the safe unique filename
        file_type: file.mimetype,
        file_size: file.size,
        uploaded_by: user.userId,
      },
      select: {
        attachment_id: true,
        asset_id: true,
        maintenance_request_id: true,
        file_name: true,
        file_type: true,
        file_size: true,
        uploaded_at: true,
        uploader: { select: { full_name: true, role: true } }
      }
    });

    await this.auditLogsService.createLog(this.prisma, {
      user_id: user.userId,
      action: 'UPLOAD_ATTACHMENT',
      entity_type: 'ATTACHMENT',
      entity_id: att.attachment_id,
      new_value: { asset_id: att.asset_id, maintenance_request_id: att.maintenance_request_id, file_name: att.file_name }
    });

    return att;
  }

  async findAll(query: AttachmentQueryDto, user: any) {
    const where: Prisma.AttachmentWhereInput = {};

    if (query.asset_id) where.asset_id = query.asset_id;
    if (query.maintenance_request_id) where.maintenance_request_id = query.maintenance_request_id;

    // Branch Manager scope
    if (user.role === 'Branch Manager') {
      where.OR = [
        { asset: { current_branch_id: user.branchId } },
        { maintenance_request: { branch_id: user.branchId } }
      ];
    }

    return this.prisma.attachment.findMany({
      where,
      orderBy: { uploaded_at: 'desc' },
      select: {
        attachment_id: true,
        asset_id: true,
        maintenance_request_id: true,
        file_name: true,
        file_type: true,
        file_size: true,
        uploaded_at: true,
        uploader: { select: { full_name: true, role: true } }
      }
    });
  }

  async findOne(id: string, user: any) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { attachment_id: id },
      include: {
        asset: true,
        maintenance_request: true,
        uploader: { select: { full_name: true, role: true } }
      }
    });

    if (!attachment) throw new NotFoundException('Attachment not found');

    if (user.role === 'Branch Manager') {
      const isAssetBranch = attachment.asset?.current_branch_id === user.branchId;
      const isMRBranch = attachment.maintenance_request?.branch_id === user.branchId;
      if (!isAssetBranch && !isMRBranch) {
        throw new ForbiddenException('Cannot view attachments outside of your branch');
      }
    }

    // Exclude physical path from metadata return
    const { file_path, asset, maintenance_request, ...safeMetadata } = attachment;
    return {
      ...safeMetadata,
      asset_id: asset?.asset_id,
      maintenance_request_id: maintenance_request?.request_id,
    };
  }

  async download(id: string, user: any) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { attachment_id: id },
      include: {
        asset: true,
        maintenance_request: true,
      }
    });

    if (!attachment) throw new NotFoundException('Attachment not found');

    if (user.role === 'Branch Manager') {
      const isAssetBranch = attachment.asset?.current_branch_id === user.branchId;
      const isMRBranch = attachment.maintenance_request?.branch_id === user.branchId;
      if (!isAssetBranch && !isMRBranch) {
        throw new ForbiddenException('Cannot download attachments outside of your branch');
      }
    }

    const fullPath = path.join(process.cwd(), 'uploads', attachment.file_path);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('Physical file not found on server');
    }

    return {
      stream: fs.createReadStream(fullPath),
      file_name: attachment.file_name,
      file_type: attachment.file_type
    };
  }

  async remove(id: string, user: any) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { attachment_id: id },
      include: { asset: true, maintenance_request: true }
    });

    if (!attachment) throw new NotFoundException('Attachment not found');

    if (user.role === 'Branch Manager') {
      const isAssetBranch = attachment.asset?.current_branch_id === user.branchId;
      const isMRBranch = attachment.maintenance_request?.branch_id === user.branchId;
      if (!isAssetBranch && !isMRBranch) {
        throw new ForbiddenException('Cannot delete attachments outside of your branch');
      }
    }

    if (user.role === 'Hardware Technician') {
       if (!attachment.maintenance_request_id) {
         throw new ForbiddenException('Technicians can only delete maintenance-related attachments');
       }
    }

    // Attempt to delete physical file safely
    const fullPath = path.join(process.cwd(), 'uploads', attachment.file_path);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {
        // Just log, don't crash, we still want to remove metadata
        console.error(`Failed to delete physical file ${fullPath}`, err);
      }
    }

    await this.prisma.attachment.delete({
      where: { attachment_id: id }
    });

    await this.auditLogsService.createLog(this.prisma, {
      user_id: user.userId,
      action: 'DELETE_ATTACHMENT',
      entity_type: 'ATTACHMENT',
      entity_id: id,
      previous_value: { asset_id: attachment.asset_id, maintenance_request_id: attachment.maintenance_request_id, file_name: attachment.file_name }
    });

    return { message: 'Attachment successfully deleted' };
  }
}
