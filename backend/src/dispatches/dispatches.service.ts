import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDispatchDto, DispatchQueryDto } from './dto/dispatch.dto';
import { Prisma, AssetStatus, DispatchStatus } from '@prisma/client';

@Injectable()
export class DispatchesService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
    private notificationsService: NotificationsService
  ) {}

  async create(createDispatchDto: CreateDispatchDto, user: any) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Verify Asset
      const asset = await tx.asset.findUnique({
        where: { asset_id: createDispatchDto.asset_id },
      });

      if (!asset) {
        throw new NotFoundException('Asset not found');
      }

      // 2. Verify Destination Branch
      const branch = await tx.branch.findUnique({
        where: { branch_id: createDispatchDto.destination_branch_id },
      });

      if (!branch) {
        throw new NotFoundException('Destination branch not found');
      }

      // 3. Check Asset eligibility
      // AVAILABLE and ASSIGNED assets can be dispatched
      if (asset.status !== AssetStatus.AVAILABLE && asset.status !== AssetStatus.ASSIGNED) {
        throw new BadRequestException(`Asset cannot be dispatched because its status is ${asset.status}`);
      }

      // 4. Verify no active dispatch exists (concurrency protection check)
      const activeDispatch = await tx.dispatch.findFirst({
        where: {
          asset_id: createDispatchDto.asset_id,
          status: DispatchStatus.DISPATCHED,
        },
      });

      if (activeDispatch) {
        throw new ConflictException('Asset already has an active unresolved dispatch');
      }

      // 5. Update asset status FIRST so that the include returns the updated asset
      await tx.asset.update({
        where: { asset_id: createDispatchDto.asset_id },
        data: { status: AssetStatus.IN_TRANSIT },
      });

      // 6. Create dispatch
      const dispatch = await tx.dispatch.create({
        data: {
          asset_id: createDispatchDto.asset_id,
          source_location: createDispatchDto.source_location,
          destination_branch_id: createDispatchDto.destination_branch_id,
          dispatched_by: user.userId,
          receiver_name: createDispatchDto.receiver_name,
          receiver_id: createDispatchDto.receiver_id,
          receiver_phone: createDispatchDto.receiver_phone,
          dispatched_date: createDispatchDto.dispatched_date ? new Date(createDispatchDto.dispatched_date) : undefined,
          status: DispatchStatus.DISPATCHED,
        },
        include: {
          asset: true,
          destination_branch: true,
        }
      });

      await this.auditLogsService.createLog(tx, {
        user_id: user.userId,
        action: 'CREATE',
        entity_type: 'DISPATCH',
        entity_id: dispatch.dispatch_id,
        new_value: { asset_id: dispatch.asset_id, source_location: dispatch.source_location, destination_branch_id: dispatch.destination_branch_id }
      });

      if (branch.manager_id) {
        await this.notificationsService.createNotification(tx, {
          user_id: branch.manager_id,
          title: 'Equipment Dispatched',
          message: `Asset ${asset.tag_no} has been dispatched to your branch from ${dispatch.source_location}.`,
          type: 'DISPATCH_CREATED'
        });
      }

      return dispatch;
    });
  }

  async findAll(query: DispatchQueryDto, user?: any) {
    const where: Prisma.DispatchWhereInput = {};

    if (user && user.role === 'Branch Manager' && user.branchId) {
      where.destination_branch_id = user.branchId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { receiver_name: { contains: query.search, mode: 'insensitive' } },
        { receiver_id: { contains: query.search, mode: 'insensitive' } },
        { asset: { tag_no: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.dispatch.findMany({
      where,
      orderBy: { dispatched_date: 'desc' },
      include: {
        asset: true,
        destination_branch: true,
      }
    });
  }

  async findOne(id: string, user?: any) {
    const dispatch = await this.prisma.dispatch.findUnique({
      where: { dispatch_id: id },
      include: {
        asset: {
          include: { asset_type: true }
        },
        destination_branch: true,
      }
    });

    if (!dispatch) {
      throw new NotFoundException('Dispatch not found');
    }

    if (user && user.role === 'Branch Manager' && user.branchId && dispatch.destination_branch_id !== user.branchId) {
      const { ForbiddenException } = require('@nestjs/common');
      throw new ForbiddenException('Branch Managers can only view dispatches to their own branch');
    }

    return dispatch;
  }

  async receiveDispatch(id: string, user: any) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Verify Dispatch
      const dispatch = await tx.dispatch.findUnique({
        where: { dispatch_id: id },
      });

      if (!dispatch) {
        throw new NotFoundException('Dispatch not found');
      }

      // 1b. Enforce Branch Manager scope
      if (user.role === 'Branch Manager' && user.branchId !== dispatch.destination_branch_id) {
        import('@nestjs/common').then(m => {
           // We can just throw error directly if ForbiddenException isn't imported at top
        });
        // We'll rely on a standard Error or we should import ForbiddenException at the top of the file
        // To be safe, let's just throw new (require('@nestjs/common').ForbiddenException)('...');
        const { ForbiddenException } = require('@nestjs/common');
        throw new ForbiddenException('Branch Managers can only receive dispatches for their own branch');
      }

      // 2. Check if active
      if (dispatch.status !== DispatchStatus.DISPATCHED) {
        throw new BadRequestException('Dispatch is already received or cancelled');
      }

      // 3. Determine next asset status based on active assignment
      const activeAssignment = await tx.assignment.findFirst({
        where: {
          asset_id: dispatch.asset_id,
          status: 'ACTIVE'
        }
      });
      const nextStatus = activeAssignment ? AssetStatus.ASSIGNED : AssetStatus.AVAILABLE;

      // 4. Update asset status and set current_branch_id
      await tx.asset.update({
        where: { asset_id: dispatch.asset_id },
        data: { 
          status: nextStatus,
          current_branch_id: dispatch.destination_branch_id
        },
      });

      // 5. Update dispatch
      const updatedDispatch = await tx.dispatch.update({
        where: { dispatch_id: id },
        data: {
          status: DispatchStatus.RECEIVED,
        },
        include: {
          asset: true,
          destination_branch: true,
        }
      });

      await this.auditLogsService.createLog(tx, {
        user_id: user.userId,
        action: 'UPDATE',
        entity_type: 'DISPATCH',
        entity_id: id,
        previous_value: { status: dispatch.status },
        new_value: { status: updatedDispatch.status }
      });

      // Notify IT Inventory Officers that the branch received it
      const officers = await tx.user.findMany({
        where: {
          role: {
            role_name: 'IT Inventory Officer'
          }
        },
        select: { user_id: true }
      });

      for (const officer of officers) {
        await this.notificationsService.createNotification(tx, {
          user_id: officer.user_id,
          title: 'Equipment Received',
          message: `Asset ${updatedDispatch.asset.tag_no} was received at ${updatedDispatch.destination_branch.branch_name}.`,
          type: 'DISPATCH_RECEIVED'
        });
      }

      // Notify the original dispatcher (if different from the receiver)
      if (dispatch.dispatched_by && dispatch.dispatched_by !== user.userId) {
        await this.notificationsService.createNotification(tx, {
          user_id: dispatch.dispatched_by,
          title: 'Asset Received at Destination',
          message: `Asset ${updatedDispatch.asset.tag_no} you dispatched has been received at ${updatedDispatch.destination_branch.branch_name}.`,
          type: 'DISPATCH_RECEIVED'
        });
      }

      return updatedDispatch;
    });
  }
}
