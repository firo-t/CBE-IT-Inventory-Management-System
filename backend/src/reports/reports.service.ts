import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryReportQueryDto, AssignmentReportQueryDto, DispatchReportQueryDto, MaintenanceReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private enforceBranchIsolation(queryBranchId: string | undefined, user: any): string | undefined {
    // If the user is a Branch Manager, they are strictly isolated to their own branch
    if (user.role === 'Branch Manager') {
      if (queryBranchId && queryBranchId !== user.branchId) {
        throw new ForbiddenException('Branch Managers can only access reports for their own branch.');
      }
      return user.branchId;
    }
    return queryBranchId;
  }

  async getInventoryReport(query: InventoryReportQueryDto, user: any) {
    const branchId = this.enforceBranchIsolation(query.branch_id, user);

    const where: any = {};
    if (branchId) where.current_branch_id = branchId;
    if (query.asset_type_id) where.asset_type_id = query.asset_type_id;
    if (query.status) where.status = query.status;
    if (query.condition) where.condition = query.condition;
    
    if (query.start_date || query.end_date) {
      where.created_at = {};
      if (query.start_date) where.created_at.gte = new Date(query.start_date);
      if (query.end_date) where.created_at.lte = new Date(query.end_date);
    }

    const assets = await this.prisma.asset.findMany({
      where,
      include: {
        asset_type: true,
        current_branch: {
          select: { branch_id: true, branch_name: true, branch_code: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return assets;
  }

  async getAssignmentReport(query: AssignmentReportQueryDto, user: any) {
    const branchId = this.enforceBranchIsolation(query.branch_id, user);

    const where: any = {};
    if (branchId) where.branch_id = branchId;
    if (query.status) where.status = query.status;
    if (query.start_date || query.end_date) {
      where.assigned_date = {};
      if (query.start_date) where.assigned_date.gte = new Date(query.start_date);
      if (query.end_date) where.assigned_date.lte = new Date(query.end_date);
    }

    const assignments = await this.prisma.assignment.findMany({
      where,
      include: {
        asset: {
          include: { asset_type: true }
        },
        branch: { select: { branch_id: true, branch_name: true } },
        assigner: { select: { user_id: true, full_name: true, employee_id: true } }
      },
      orderBy: { assigned_date: 'desc' }
    });

    return assignments;
  }

  async getDispatchReport(query: DispatchReportQueryDto, user: any) {
    const destBranchId = this.enforceBranchIsolation(query.destination_branch_id, user);

    const where: any = {};
    if (destBranchId) where.destination_branch_id = destBranchId;
    // Source location is just a string in the DB, not a foreign key. We omit the source_branch_id relation check for dispatches as it isn't in schema
    if (query.status) where.status = query.status;
    if (query.start_date || query.end_date) {
      where.dispatched_date = {};
      if (query.start_date) where.dispatched_date.gte = new Date(query.start_date);
      if (query.end_date) where.dispatched_date.lte = new Date(query.end_date);
    }

    const dispatches = await this.prisma.dispatch.findMany({
      where,
      include: {
        asset: { include: { asset_type: true } },
        destination_branch: { select: { branch_id: true, branch_name: true } }
      },
      orderBy: { dispatched_date: 'desc' }
    });

    return dispatches;
  }

  async getMaintenanceReport(query: MaintenanceReportQueryDto, user: any) {
    const branchId = this.enforceBranchIsolation(query.branch_id, user);

    const where: any = {};
    if (branchId) where.branch_id = branchId;
    if (query.priority) where.priority = query.priority;
    if (query.status) where.status = query.status;
    if (query.start_date || query.end_date) {
      where.reported_date = {};
      if (query.start_date) where.reported_date.gte = new Date(query.start_date);
      if (query.end_date) where.reported_date.lte = new Date(query.end_date);
    }
    if (query.technician_id) {
      where.maintenance_record = { technician_id: query.technician_id };
    }

    const maintenance = await this.prisma.maintenanceRequest.findMany({
      where,
      include: {
        asset: { include: { asset_type: true } },
        branch: { select: { branch_id: true, branch_name: true } },
        reporter: { select: { user_id: true, full_name: true, employee_id: true } },
        maintenance_record: {
          include: {
            technician: { select: { user_id: true, full_name: true, employee_id: true } }
          }
        }
      },
      orderBy: { reported_date: 'desc' }
    });

    return maintenance;
  }
}
