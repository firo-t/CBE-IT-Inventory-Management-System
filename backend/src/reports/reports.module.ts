import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfExportService } from './services/pdf-export.service';
import { ExcelExportService } from './services/excel-export.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController],
  providers: [ReportsService, PdfExportService, ExcelExportService],
})
export class ReportsModule {}
