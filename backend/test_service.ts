import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceService } from './src/maintenance/maintenance.service';
import { PrismaService } from './src/prisma/prisma.service';
import { AuditLogsService } from './src/audit-logs/audit-logs.service';
import { NotificationsService } from './src/notifications/notifications.service';
import { MaintenanceStatus } from '@prisma/client';

async function run() {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      MaintenanceService,
      {
        provide: PrismaService,
        useValue: {
          $transaction: async (cb: any) => await cb({
            maintenanceRequest: {
              findUnique: jest.fn().mockResolvedValue({ request_id: 'req1', asset_id: 'ast1', status: 'ASSIGNED' }),
              update: jest.fn().mockResolvedValue({}),
            },
            maintenanceRecord: {
              findUnique: jest.fn().mockResolvedValue({
                request_id: 'req1',
                technician_id: 'tech1',
                status: 'ASSIGNED',
              }),
              update: jest.fn().mockResolvedValue({
                request_id: 'req1',
                diagnosis: 'Mock updated',
                repair_action: 'Mock updated',
                parts_used: 'Mock updated',
                remarks: 'Mock updated',
                status: 'UNDER_INSPECTION'
              }),
            },
            asset: {
              update: jest.fn().mockResolvedValue({}),
            },
            assignment: {
              findFirst: jest.fn().mockResolvedValue(null)
            }
          }),
        },
      },
      {
        provide: AuditLogsService,
        useValue: { createLog: jest.fn().mockResolvedValue({}) },
      },
      {
        provide: NotificationsService,
        useValue: { createNotification: jest.fn().mockResolvedValue({}) },
      },
    ],
  }).compile();

  const service = module.get<MaintenanceService>(MaintenanceService);
  const prisma = module.get<PrismaService>(PrismaService);
  
  const dto = {
    diagnosis: "Cooling fan is clogged with dust and the thermal system requires cleaning",
    repair_action: "Cleaned cooling fan and internal components",
    parts_used: "None",
    remarks: "Laptop tested after cleaning"
  };

  const user = { userId: 'tech1', role: 'Hardware Technician' };

  const result = await service.createRecord('req1', dto, user);
  console.log("Service Result:", result);
}

run().catch(console.error);
