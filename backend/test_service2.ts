import { MaintenanceService } from './src/maintenance/maintenance.service';

async function run() {
  const prismaMock = {
    $transaction: async (cb: any) => await cb({
      maintenanceRequest: {
        findUnique: async () => ({ request_id: 'req1', asset_id: 'ast1', status: 'ASSIGNED' }),
        update: async () => ({}),
      },
      maintenanceRecord: {
        findUnique: async () => ({
          request_id: 'req1',
          technician_id: 'tech1',
          status: 'ASSIGNED',
        }),
        update: async (args: any) => {
          console.log("PRISMA UPDATE ARGS:", args);
          return {
            request_id: 'req1',
            ...args.data
          };
        },
      },
      asset: {
        update: async () => ({}),
      },
      assignment: {
        findFirst: async () => (null)
      }
    }),
  };

  const auditLogsMock = { createLog: async (tx: any, args: any) => { console.log("AUDIT LOG ARGS:", args); return {}; } };
  const notificationsMock = { createNotification: async () => ({}) };

  const service = new MaintenanceService(prismaMock as any, auditLogsMock as any, notificationsMock as any);
  
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
