import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignmentDto, AssignmentQueryDto } from './dto/assignment.dto';
import { Prisma, AssetStatus, AssignmentStatus } from '@prisma/client';

@Injectable()
export class AssignmentsService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
    private notificationsService: NotificationsService
  ) {}

  async create(createAssignmentDto: CreateAssignmentDto, user: any) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Verify Asset
      const asset = await tx.asset.findUnique({
        where: { asset_id: createAssignmentDto.asset_id },
      });

      if (!asset) {
        throw new NotFoundException('Asset not found');
      }

      // 2. Verify Branch
      const branch = await tx.branch.findUnique({
        where: { branch_id: createAssignmentDto.branch_id },
      });

      if (!branch) {
        throw new NotFoundException('Branch not found');
      }

      // 3. Asset status check
      if (asset.status !== AssetStatus.AVAILABLE) {
        throw new BadRequestException(`Asset cannot be assigned because its status is ${asset.status}`);
      }

      // 4. Verify no active assignment exists (concurrency protection check)
      const activeAssignment = await tx.assignment.findFirst({
        where: {
          asset_id: createAssignmentDto.asset_id,
          status: AssignmentStatus.ACTIVE,
        },
      });

      if (activeAssignment) {
        throw new ConflictException('Asset already has an active assignment');
      }

      // 5. Update asset status FIRST so that the assignment include returns the updated asset
      await tx.asset.update({
        where: { asset_id: createAssignmentDto.asset_id },
        data: { status: AssetStatus.ASSIGNED },
      });

      // 6. Create assignment
      const assignment = await tx.assignment.create({
        data: {
          asset_id: createAssignmentDto.asset_id,
          employee_id: createAssignmentDto.employee_id,
          employee_name: createAssignmentDto.employee_name,
          branch_id: createAssignmentDto.branch_id,
          assigned_by: user.userId,
          assigned_date: createAssignmentDto.assigned_date ? new Date(createAssignmentDto.assigned_date) : undefined,
          status: AssignmentStatus.ACTIVE,
        },
        include: {
          asset: true,
          branch: true,
          assigner: {
            select: {
              user_id: true,
              full_name: true,
              email: true,
              role: true,
            }
          }
        }
      });

      await this.auditLogsService.createLog(tx, {
        user_id: user.userId,
        action: 'CREATE',
        entity_type: 'ASSIGNMENT',
        entity_id: assignment.assignment_id,
        new_value: { asset_id: assignment.asset_id, employee_id: assignment.employee_id, branch_id: assignment.branch_id }
      });

      if (branch.manager_id) {
        await this.notificationsService.createNotification(tx, {
          user_id: branch.manager_id,
          title: 'Asset Assigned',
          message: `Asset ${asset.tag_no} has been assigned to employee ${assignment.employee_name} (${assignment.employee_id}) in your branch.`,
          type: 'ASSIGNMENT_CREATED'
        });
      }

      return assignment;
    });
  }

  async findAll(query: AssignmentQueryDto, user?: any) {
    const where: Prisma.AssignmentWhereInput = {};

    if (user && user.role === 'Branch Manager' && user.branchId) {
      where.branch_id = user.branchId;
    }

    if (query.status) {
      where.status = query.status;
    }

    return this.prisma.assignment.findMany({
      where,
      orderBy: { assigned_date: 'desc' },
      include: {
        asset: true,
        branch: true,
        assigner: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            role: true,
          }
        }
      }
    });
  }

  async findOne(id: string, user?: any) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { assignment_id: id },
      include: {
        asset: true,
        branch: true,
        assigner: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (user && user.role === 'Branch Manager' && user.branchId && assignment.branch_id !== user.branchId) {
      const { ForbiddenException } = require('@nestjs/common');
      throw new ForbiddenException('Branch Managers can only view assignments in their own branch');
    }

    return assignment;
  }

  async returnAssignment(id: string, user: any) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Verify Assignment
      const assignment = await tx.assignment.findUnique({
        where: { assignment_id: id },
      });

      if (!assignment) {
        throw new NotFoundException('Assignment not found');
      }

      // 2. Check if active
      if (assignment.status !== AssignmentStatus.ACTIVE) {
        throw new BadRequestException('Assignment is already returned or not active');
      }

      // 3. Update asset status to AVAILABLE FIRST
      await tx.asset.update({
        where: { asset_id: assignment.asset_id },
        data: { status: AssetStatus.AVAILABLE },
      });

      // 4. Update assignment
      const updatedAssignment = await tx.assignment.update({
        where: { assignment_id: id },
        data: {
          status: AssignmentStatus.RETURNED,
          returned_date: new Date(),
        },
        include: {
          asset: true,
          branch: true,
          assigner: {
            select: {
              user_id: true,
              full_name: true,
              email: true,
              role: true,
            }
          }
        }
      });

      await this.auditLogsService.createLog(tx, {
        user_id: user.userId,
        action: 'UPDATE',
        entity_type: 'ASSIGNMENT',
        entity_id: id,
        previous_value: { status: assignment.status },
        new_value: { status: updatedAssignment.status, returned_date: updatedAssignment.returned_date }
      });

      return updatedAssignment;
    });
  }
}
