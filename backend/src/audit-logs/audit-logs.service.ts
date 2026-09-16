import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogQueryDto } from './dto/audit-log.dto';

export interface CreateLogParams {
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  previous_value?: any;
  new_value?: any;
  ip_address?: string;
}

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  // Accept a transaction client or use the default PrismaClient
  async createLog(tx: any, params: CreateLogParams) {
    const db = tx || this.prisma;
    
    // Construct safe description safely removing sensitive data
    const buildSafeData = (data: any) => {
      if (!data) return undefined;
      const copy = { ...data };
      delete copy.password;
      delete copy.password_hash;
      delete copy.access_token;
      return copy;
    };

    let descriptionObj: any = {};
    if (params.previous_value) descriptionObj.previous = buildSafeData(params.previous_value);
    if (params.new_value) descriptionObj.new = buildSafeData(params.new_value);
    
    let descriptionStr = null;
    if (Object.keys(descriptionObj).length > 0) {
      descriptionStr = JSON.stringify(descriptionObj);
    }

    return db.auditLog.create({
      data: {
        user_id: params.user_id,
        action: params.action,
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        description: descriptionStr,
        ip_address: params.ip_address,
      }
    });
  }

  async findAll(query: AuditLogQueryDto) {
    const where: any = {};
    if (query.user_id) where.user_id = query.user_id;
    if (query.action) where.action = query.action;
    if (query.entity_type) where.entity_type = query.entity_type;
    if (query.entity_id) where.entity_id = query.entity_id;
    if (query.search) {
      where.OR = [
        { action: { contains: query.search, mode: 'insensitive' } },
        { entity_id: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { full_name: true, role: true } }
      }
    });
  }

  async findOne(id: string) {
    const log = await this.prisma.auditLog.findUnique({
      where: { audit_id: id },
      include: {
        user: { select: { full_name: true, role: true } }
      }
    });
    if (!log) throw new NotFoundException('Audit log not found');
    return log;
  }
}
