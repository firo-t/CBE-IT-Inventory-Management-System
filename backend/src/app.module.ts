import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BranchesModule } from './branches/branches.module';
import { AssetTypesModule } from './asset-types/asset-types.module';
import { AssetsModule } from './assets/assets.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { DispatchesModule } from './dispatches/dispatches.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    BranchesModule,
    AssetTypesModule,
    AssetsModule,
    AssignmentsModule,
    DispatchesModule,
    MaintenanceModule,
    AttachmentsModule,
    AuditLogsModule,
    NotificationsModule,
    ReportsModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
