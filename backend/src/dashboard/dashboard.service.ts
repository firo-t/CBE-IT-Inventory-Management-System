import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssetStatus, DispatchStatus, MaintenanceStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData(user: any) {
    switch (user.role) {
      case 'System Administrator / Admin':
        return this.getAdminDashboard();
      case 'IT Inventory Officer':
        return this.getItOfficerDashboard();
      case 'Hardware Technician':
        return this.getTechnicianDashboard(user);
      case 'Branch Manager':
        return this.getBranchManagerDashboard(user);
      default:
        throw new ForbiddenException('Role not supported for dashboard');
    }
  }

  private async getAdminDashboard() {
    const [
      totalAssets,
      totalBranches,
      totalUsers,
      availableAssets,
      assignedAssets,
      damagedAssets,
      maintenanceStatsRaw,
      recentActivities
    ] = await Promise.all([
      this.prisma.asset.count(),
      this.prisma.branch.count(),
      this.prisma.user.count(),
      this.prisma.asset.count({ where: { status: AssetStatus.AVAILABLE } }),
      this.prisma.asset.count({ where: { status: AssetStatus.ASSIGNED } }),
      this.prisma.asset.count({ where: { status: AssetStatus.DAMAGED } }),
      this.prisma.maintenanceRequest.groupBy({ by: ['status'], _count: true }),
      this.prisma.auditLog.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: { user: { select: { user_id: true, full_name: true, email: true, role: { select: { role_name: true } } } } }
      })
    ]);

    const maintenanceStats = maintenanceStatsRaw.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      role: 'System Administrator / Admin',
      summary: {
        totalAssets,
        totalBranches,
        totalUsers,
        availableAssets,
        assignedAssets,
        damagedAssets,
        maintenanceStats
      },
      recent: {
        recentActivities
      }
    };
  }

  private async getItOfficerDashboard() {
    const [
      availableAssets,
      assignedAssets,
      pendingDispatches,
      activeMaintenance,
      recentReceivedAssets,
      recentDispatchedAssets
    ] = await Promise.all([
      this.prisma.asset.count({ where: { status: AssetStatus.AVAILABLE } }),
      this.prisma.asset.count({ where: { status: AssetStatus.ASSIGNED } }),
      this.prisma.dispatch.count({ where: { status: DispatchStatus.DISPATCHED } }),
      this.prisma.maintenanceRequest.count({
        where: {
          status: { notIn: [MaintenanceStatus.COMPLETED, MaintenanceStatus.CLOSED] }
        }
      }),
      this.prisma.dispatch.findMany({
        where: { status: DispatchStatus.RECEIVED },
        take: 10,
        orderBy: { dispatched_date: 'desc' },
        include: { asset: true, destination_branch: true }
      }),
      this.prisma.dispatch.findMany({
        where: { status: DispatchStatus.DISPATCHED },
        take: 10,
        orderBy: { dispatched_date: 'desc' },
        include: { asset: true, destination_branch: true }
      })
    ]);

    return {
      role: 'IT Inventory Officer',
      summary: {
        availableAssets,
        assignedAssets,
        pendingDispatches,
        activeMaintenance
      },
      recent: {
        recentReceivedAssets,
        recentDispatchedAssets
      }
    };
  }

  private async getTechnicianDashboard(user: any) {
    const techId = user.userId;

    const [
      assignedRequests,
      pendingInspections,
      underRepair,
      waitingForParts,
      completedMaintenance,
      recentAssignedRequests
    ] = await Promise.all([
      this.prisma.maintenanceRecord.count({
        where: {
            technician_id: techId,
            status: { notIn: [MaintenanceStatus.COMPLETED, MaintenanceStatus.CLOSED] }
        }
      }),
      this.prisma.maintenanceRecord.count({ where: { technician_id: techId, status: MaintenanceStatus.UNDER_INSPECTION } }),
      this.prisma.maintenanceRecord.count({ where: { technician_id: techId, status: MaintenanceStatus.UNDER_REPAIR } }),
      this.prisma.maintenanceRecord.count({ where: { technician_id: techId, status: MaintenanceStatus.WAITING_FOR_PARTS } }),
      this.prisma.maintenanceRecord.count({ where: { technician_id: techId, status: MaintenanceStatus.COMPLETED } }),
      this.prisma.maintenanceRequest.findMany({
        where: { maintenance_record: { technician_id: techId } },
        take: 10,
        orderBy: { reported_date: 'desc' },
        include: { asset: true, reporter: { select: { full_name: true } }, branch: true, maintenance_record: true }
      })
    ]);

    return {
      role: 'Hardware Technician',
      summary: {
        assignedRequests,
        pendingInspections,
        underRepair,
        waitingForParts,
        completedMaintenance
      },
      recent: {
        recentAssignedRequests
      }
    };
  }

  private async getBranchManagerDashboard(user: any) {
    const branchId = user.branchId;

    const [
      branchTotalAssets,
      branchAssignedAssets,
      pendingInTransit,
      branchMaintenanceRequests,
      recentBranchMaintenance
    ] = await Promise.all([
      this.prisma.asset.count({ where: { current_branch_id: branchId } }),
      this.prisma.asset.count({ where: { current_branch_id: branchId, status: AssetStatus.ASSIGNED } }),
      this.prisma.dispatch.count({ where: { destination_branch_id: branchId, status: DispatchStatus.DISPATCHED } }),
      this.prisma.maintenanceRequest.count({ where: { branch_id: branchId } }),
      this.prisma.maintenanceRequest.findMany({
        where: { branch_id: branchId },
        take: 10,
        orderBy: { reported_date: 'desc' },
        include: { asset: true, reporter: { select: { full_name: true } }, maintenance_record: { select: { status: true, technician: { select: { full_name: true } } } } }
      })
    ]);

    return {
      role: 'Branch Manager',
      summary: {
        branchTotalAssets,
        branchAssignedAssets,
        pendingInTransit,
        branchMaintenanceRequests
      },
      recent: {
        recentBranchMaintenance
      }
    };
  }
}
