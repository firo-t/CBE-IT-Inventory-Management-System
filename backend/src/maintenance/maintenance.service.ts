import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Injectable, ConflictException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceRequestDto, UpdateMaintenanceRequestDto, UpdateMaintenanceStatusDto, AssignTechnicianDto, CreateMaintenanceRecordDto, MaintenanceQueryDto } from './dto/maintenance.dto';
import { Prisma, AssetStatus, MaintenanceStatus, MaintenancePriority } from '@prisma/client';

@Injectable()
export class MaintenanceService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
    private notificationsService: NotificationsService
  ) {}

  async createRequest(createDto: CreateMaintenanceRequestDto, user: any) {
    return this.prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({
        where: { asset_id: createDto.asset_id },
      });

      if (!asset) {
        throw new NotFoundException('Asset not found');
      }

      // 1. Branch Manager scope check
      if (user.role === 'Branch Manager' && user.branchId !== asset.current_branch_id) {
        throw new ForbiddenException('Branch Managers can only report problems for assets currently in their branch');
      }

      // 2. Reject if asset is in invalid state
      const invalidStatuses: AssetStatus[] = [
        AssetStatus.IN_TRANSIT,
        AssetStatus.LOST,
        AssetStatus.DISPOSED,
        AssetStatus.RETIRED,
      ];
      if (invalidStatuses.includes(asset.status)) {
        throw new BadRequestException(`Asset cannot enter maintenance while its status is ${asset.status}`);
      }

      // 3. Conflict protection
      const activeMaintenance = await tx.maintenanceRequest.findFirst({
        where: {
          asset_id: asset.asset_id,
          status: {
            notIn: [MaintenanceStatus.COMPLETED, MaintenanceStatus.CLOSED]
          }
        }
      });

      if (activeMaintenance) {
        throw new ConflictException('Asset already has an active maintenance request');
      }

      // 4. Update asset status
      await tx.asset.update({
        where: { asset_id: asset.asset_id },
        data: { status: AssetStatus.UNDER_MAINTENANCE }
      });

      // 5. Create request
      const request = await tx.maintenanceRequest.create({
        data: {
          asset_id: asset.asset_id,
          reported_by: user.userId,
          branch_id: asset.current_branch_id || user.branchId, // fallback to user's branch if current_branch is null
          problem_description: createDto.problem_description,
          priority: createDto.priority || MaintenancePriority.MEDIUM,
          status: MaintenanceStatus.REPORTED,
        },
        include: {
          asset: true,
          reporter: { select: { full_name: true, role: true } },
          branch: true,
        }
      });

      await this.auditLogsService.createLog(tx, {
        user_id: user.userId,
        action: 'CREATE',
        entity_type: 'MAINTENANCE_REQUEST',
        entity_id: request.request_id,
        new_value: { asset_id: request.asset_id, problem_description: request.problem_description, priority: request.priority, status: request.status }
      });

      const technicians = await tx.user.findMany({
        where: { role: { role_name: 'Hardware Technician' } },
        select: { user_id: true }
      });

      for (const tech of technicians) {
        await this.notificationsService.createNotification(tx, {
          user_id: tech.user_id,
          title: 'New Maintenance Request',
          message: `Asset ${asset.tag_no} has been reported for maintenance. Priority: ${request.priority}.`,
          type: 'MAINTENANCE_CREATED'
        });
      }

      return request;
    });
  }

  async findAllRequests(query: MaintenanceQueryDto, user: any) {
    const where: Prisma.MaintenanceRequestWhereInput = {};

    if (query.asset_id) where.asset_id = query.asset_id;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.search) {
      where.OR = [
        { problem_description: { contains: query.search, mode: 'insensitive' } },
        { asset: { tag_no: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    // Role-based scoping
    if (user.role === 'Branch Manager') {
      where.branch_id = user.branchId;
    } else if (user.role === 'Hardware Technician') {
      where.OR = [
        { reported_by: user.userId },
        { maintenance_record: { technician_id: user.userId } }
      ];
    } else if (user.role !== 'System Administrator / Admin' && user.role !== 'IT Inventory Officer') {
      // Normal users can only see what they reported
      where.reported_by = user.userId;
    }

    return this.prisma.maintenanceRequest.findMany({
      where,
      orderBy: { reported_date: 'desc' },
      include: {
        asset: true,
        reporter: { select: { full_name: true, role: true } },
        branch: true,
        maintenance_record: {
          include: { technician: { select: { full_name: true } } }
        },
      }
    });
  }

  async findOneRequest(id: string, user: any) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { request_id: id },
      include: {
        asset: true,
        reporter: { select: { full_name: true, role: true } },
        branch: true,
        maintenance_record: {
          include: { technician: { select: { full_name: true } } }
        }
      }
    });

    if (!request) throw new NotFoundException('Maintenance request not found');

    if (user.role === 'Branch Manager' && user.branchId !== request.branch_id) {
      throw new ForbiddenException('Branch Managers can only view their own branch requests');
    } else if (user.role === 'Hardware Technician') {
      if (request.reported_by !== user.userId && request.maintenance_record?.technician_id !== user.userId) {
        throw new ForbiddenException('Technicians can only view requests they reported or are assigned to');
      }
    } else if (user.role !== 'System Administrator / Admin' && user.role !== 'IT Inventory Officer' && user.role !== 'Branch Manager') {
      if (request.reported_by !== user.userId) {
        throw new ForbiddenException('You can only view your own maintenance requests');
      }
    }

    return request;
  }

  async updateRequest(id: string, updateDto: UpdateMaintenanceRequestDto, user: any) {
    const request = await this.findOneRequest(id, user); // Will throw 404/403

    return this.prisma.maintenanceRequest.update({
      where: { request_id: id },
      data: {
        problem_description: updateDto.problem_description !== undefined ? updateDto.problem_description : undefined,
        priority: updateDto.priority !== undefined ? updateDto.priority : undefined,
      },
      include: {
        asset: true,
      }
    });
  }

  async createRecord(id: string, recordDto: CreateMaintenanceRecordDto, user: any) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.maintenanceRequest.findUnique({
        where: { request_id: id }
      });
      if (!request) throw new NotFoundException('Maintenance request not found');

      if (request.status === MaintenanceStatus.COMPLETED || request.status === MaintenanceStatus.CLOSED) {
        throw new BadRequestException('Cannot add records to completed/closed requests');
      }

      // Check if record exists
      const existing = await tx.maintenanceRecord.findUnique({
        where: { request_id: id }
      });

      let record;
      if (existing) {
        // Enforce assignment rules
        if (existing.technician_id && existing.technician_id !== user.userId && user.role !== 'System Administrator / Admin' && user.role !== 'IT Inventory Officer') {
          throw new ForbiddenException('You cannot update a maintenance record assigned to another technician');
        }

        const newStatus = existing.status === MaintenanceStatus.ASSIGNED ? MaintenanceStatus.UNDER_INSPECTION : undefined;

        record = await tx.maintenanceRecord.update({
          where: { request_id: id },
          data: {
            technician_id: existing.technician_id || user.userId,
            diagnosis: recordDto.diagnosis !== undefined ? recordDto.diagnosis : undefined,
            repair_action: recordDto.repair_action !== undefined ? recordDto.repair_action : undefined,
            parts_used: recordDto.parts_used !== undefined ? recordDto.parts_used : undefined,
            remarks: recordDto.remarks !== undefined ? recordDto.remarks : undefined,
            start_date: recordDto.start_date ? new Date(recordDto.start_date) : undefined,
            completion_date: recordDto.completion_date ? new Date(recordDto.completion_date) : undefined,
            ...(newStatus && { status: newStatus }),
          }
        });

        if (newStatus) {
          await tx.maintenanceRequest.update({
            where: { request_id: id },
            data: { status: newStatus }
          });
        }
      } else {
        record = await tx.maintenanceRecord.create({
          data: {
            request_id: id,
            technician_id: user.userId,
            diagnosis: recordDto.diagnosis,
            repair_action: recordDto.repair_action,
            parts_used: recordDto.parts_used,
            remarks: recordDto.remarks,
            start_date: recordDto.start_date ? new Date(recordDto.start_date) : undefined,
            completion_date: recordDto.completion_date ? new Date(recordDto.completion_date) : undefined,
            status: MaintenanceStatus.UNDER_INSPECTION,
          }
        });
      }

      // Update asset condition if provided
      if (recordDto.condition) {
        await tx.asset.update({
          where: { asset_id: request.asset_id },
          data: { condition: recordDto.condition }
        });
      }

      await this.auditLogsService.createLog(tx, {
        user_id: user.userId,
        action: 'CREATE_OR_UPDATE_RECORD',
        entity_type: 'MAINTENANCE_RECORD',
        entity_id: record.maintenance_id,
        new_value: { diagnosis: record.diagnosis, repair_action: record.repair_action, status: record.status }
      });

      // Notify the reporter
      if (request.reported_by && request.reported_by !== user.userId) {
        await this.notificationsService.createNotification(tx, {
          user_id: request.reported_by,
          title: 'Maintenance Record Updated',
          message: `The technician has added or updated the maintenance record for your asset.`,
          type: 'MAINTENANCE_RECORD_UPDATED'
        });
      }

      return record;
    });
  }

  async assignTechnician(id: string, assignDto: AssignTechnicianDto, user: any) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.maintenanceRequest.findUnique({
        where: { request_id: id },
        include: { maintenance_record: true, asset: true }
      });

      if (!request) throw new NotFoundException('Maintenance request not found');

      if (request.status === MaintenanceStatus.COMPLETED || request.status === MaintenanceStatus.CLOSED) {
        throw new BadRequestException('Cannot assign a completed or closed request');
      }

      if (user.role === 'Branch Manager' && user.branchId !== request.branch_id) {
        throw new ForbiddenException('Branch Managers can only assign requests within their own branch');
      }

      let technicianId = assignDto.technician_id;
      if (!technicianId) {
        if (user.role !== 'Hardware Technician') {
          throw new BadRequestException('technician_id is required unless self-assigning as a Hardware Technician');
        }
        technicianId = user.userId;
      }

      if (user.role === 'Hardware Technician' && technicianId !== user.userId) {
        throw new ForbiddenException('Hardware Technicians can only self-assign');
      }

      const technician = await tx.user.findUnique({
        where: { user_id: technicianId },
        include: { role: true }
      });

      if (!technician || technician.status !== 'ACTIVE' || technician.role.role_name !== 'Hardware Technician') {
        throw new BadRequestException('Invalid technician specified');
      }

      // Removed: Branch Managers are allowed to assign technicians outside their branch because technicians operate at the district level.

      let record = request.maintenance_record;
      if (record) {
        record = await tx.maintenanceRecord.update({
          where: { request_id: id },
          data: { technician_id: technicianId }
        });
      } else {
        record = await tx.maintenanceRecord.create({
          data: {
            request_id: id,
            technician_id: technicianId,
            status: MaintenanceStatus.ASSIGNED
          }
        });
      }

      if (request.status === MaintenanceStatus.REPORTED || request.status === MaintenanceStatus.RECEIVED) {
        await tx.maintenanceRequest.update({
          where: { request_id: id },
          data: { status: MaintenanceStatus.ASSIGNED }
        });
      }

      await this.auditLogsService.createLog(tx, {
        user_id: user.userId,
        action: 'ASSIGN_TECHNICIAN',
        entity_type: 'MAINTENANCE_REQUEST',
        entity_id: id,
        new_value: { technician_id: technicianId }
      });

      if (technicianId !== user.userId) {
        await this.notificationsService.createNotification(tx, {
          user_id: technicianId,
          title: 'Maintenance Assigned',
          message: `You have been assigned to maintenance request for asset ${request.asset.tag_no}.`,
          type: 'MAINTENANCE_ASSIGNED'
        });
      }

      // Notify the reporter
      if (request.reported_by && request.reported_by !== technicianId) {
        await this.notificationsService.createNotification(tx, {
          user_id: request.reported_by,
          title: 'Technician Assigned',
          message: `Technician ${technician.full_name} has been assigned to your maintenance request for asset ${request.asset.tag_no}.`,
          type: 'MAINTENANCE_ASSIGNED'
        });
      }

      return record;
    });
  }

  async updateStatus(id: string, statusDto: UpdateMaintenanceStatusDto, user: any) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.maintenanceRequest.findUnique({
        where: { request_id: id },
        include: { maintenance_record: true, asset: true, branch: true }
      });

      if (!request) throw new NotFoundException('Maintenance request not found');

      const isCompleting = statusDto.status === MaintenanceStatus.COMPLETED || statusDto.status === MaintenanceStatus.CLOSED;

      if (request.status === MaintenanceStatus.CLOSED && statusDto.status !== MaintenanceStatus.CLOSED) {
         throw new BadRequestException('Cannot reopen a closed maintenance request');
      }

      if (isCompleting) {
        // Completion Rule: required result/condition
        const record = request.maintenance_record;
        if (!record || !record.repair_action) {
          throw new BadRequestException('Maintenance completion requires a maintenance record with repair_action (result) populated');
        }
        if (!request.asset.condition) {
          throw new BadRequestException('Maintenance completion requires asset condition to be recorded');
        }

        // Determine post-maintenance asset status
        const activeAssignment = await tx.assignment.findFirst({
          where: { asset_id: request.asset_id, status: 'ACTIVE' }
        });
        const nextAssetStatus = activeAssignment ? AssetStatus.ASSIGNED : AssetStatus.AVAILABLE;

        await tx.asset.update({
          where: { asset_id: request.asset_id },
          data: { status: nextAssetStatus }
        });
      }

      if (request.maintenance_record) {
         await tx.maintenanceRecord.update({
           where: { request_id: id },
           data: { 
             status: statusDto.status,
             ...(statusDto.status === MaintenanceStatus.COMPLETED && !request.maintenance_record.completion_date ? { completion_date: new Date() } : {})
           }
         });
      }

      const updated = await tx.maintenanceRequest.update({
        where: { request_id: id },
        data: { status: statusDto.status },
        include: { asset: true, maintenance_record: true }
      });

      await this.auditLogsService.createLog(tx, {
        user_id: user.userId,
        action: 'UPDATE_STATUS',
        entity_type: 'MAINTENANCE_REQUEST',
        entity_id: id,
        previous_value: { status: request.status },
        new_value: { status: updated.status }
      });

      // Notify the reporter of the status change
      if (request.status !== updated.status) {
        await this.notificationsService.createNotification(tx, {
          user_id: request.reported_by,
          title: 'Maintenance Status Updated',
          message: `Maintenance request for asset ${request.asset.tag_no} is now ${updated.status}.`,
          type: isCompleting ? 'MAINTENANCE_COMPLETED' : 'MAINTENANCE_STATUS_CHANGED'
        });
        
        // Notify the branch manager if completing
        if (isCompleting && request.branch?.manager_id && request.branch.manager_id !== request.reported_by) {
          await this.notificationsService.createNotification(tx, {
            user_id: request.branch.manager_id,
            title: 'Asset Maintenance Completed',
            message: `Maintenance for asset ${request.asset.tag_no} at your branch is now complete.`,
            type: 'MAINTENANCE_COMPLETED'
          });
        }
      }

      return updated;
    });
  }
}
