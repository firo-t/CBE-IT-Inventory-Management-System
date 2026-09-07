import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const request_id = "f1852021-2e09-4557-bebd-660918856c51";
  
  // get existing record
  const existing = await prisma.maintenanceRecord.findUnique({
    where: { request_id }
  });

  console.log("Existing record:", existing);

  if (existing) {
    const recordDto = {
      diagnosis: "Cooling fan is clogged with dust and the thermal system requires cleaning",
      repair_action: "Cleaned cooling fan and internal components",
      parts_used: "None",
      remarks: "Laptop tested after cleaning"
    };

    const newStatus = "UNDER_INSPECTION";

    const updateData = {
      technician_id: existing.technician_id,
      diagnosis: recordDto.diagnosis !== undefined ? recordDto.diagnosis : undefined,
      repair_action: recordDto.repair_action !== undefined ? recordDto.repair_action : undefined,
      parts_used: recordDto.parts_used !== undefined ? recordDto.parts_used : undefined,
      remarks: recordDto.remarks !== undefined ? recordDto.remarks : undefined,
      ...(newStatus && { status: newStatus as any }),
    };

    console.log("Update Data:", updateData);

    const record = await prisma.maintenanceRecord.update({
      where: { request_id },
      data: updateData
    });

    console.log("Updated record:", record);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
