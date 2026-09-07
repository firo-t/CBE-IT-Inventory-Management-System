import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { CreateMaintenanceRecordDto } from './src/maintenance/dto/maintenance.dto';

async function test() {
  const pipe = new ValidationPipe({ whitelist: true, transform: true });
  
  const payload = {
    "diagnosis": "Cooling fan is clogged with dust and the thermal system requires cleaning",
    "repair_action": "Cleaned cooling fan and internal components",
    "parts_used": "None",
    "remarks": "Laptop tested after cleaning"
  };

  try {
    const result = await pipe.transform(payload, { type: 'body', metatype: CreateMaintenanceRecordDto });
    console.log("Transformed result:", result);
  } catch (err) {
    console.error("Validation error:", err);
  }
}

test();
