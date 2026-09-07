import { Controller, Get, UseGuards, Query, Res } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReportsService } from './reports.service';
import { PdfExportService } from './services/pdf-export.service';
import { ExcelExportService } from './services/excel-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { InventoryReportQueryDto, AssignmentReportQueryDto, DispatchReportQueryDto, MaintenanceReportQueryDto } from './dto/report-query.dto';
import { Response } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly pdfExportService: PdfExportService,
    private readonly excelExportService: ExcelExportService,
  ) {}

  // ---------------------------------------------------------
  // INVENTORY
  // ---------------------------------------------------------
  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get('inventory')
  getInventoryReport(@Query() query: InventoryReportQueryDto, @CurrentUser() user: any) {
    return this.reportsService.getInventoryReport(query, user);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get('inventory/pdf')
  async getInventoryReportPdf(@Query() query: InventoryReportQueryDto, @CurrentUser() user: any, @Res() res: Response) {
    const data = await this.reportsService.getInventoryReport(query, user);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="inventory-report-${Date.now()}.pdf"`);
    this.pdfExportService.generateInventoryPdf(data, res);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get('inventory/excel')
  async getInventoryReportExcel(@Query() query: InventoryReportQueryDto, @CurrentUser() user: any, @Res() res: Response) {
    const data = await this.reportsService.getInventoryReport(query, user);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="inventory-report-${Date.now()}.xlsx"`);
    await this.excelExportService.generateInventoryExcel(data, res);
  }

  // ---------------------------------------------------------
  // ASSIGNMENTS
  // ---------------------------------------------------------
  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get('assignments')
  getAssignmentReport(@Query() query: AssignmentReportQueryDto, @CurrentUser() user: any) {
    return this.reportsService.getAssignmentReport(query, user);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get('assignments/pdf')
  async getAssignmentReportPdf(@Query() query: AssignmentReportQueryDto, @CurrentUser() user: any, @Res() res: Response) {
    const data = await this.reportsService.getAssignmentReport(query, user);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="assignments-report-${Date.now()}.pdf"`);
    this.pdfExportService.generateAssignmentsPdf(data, res);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get('assignments/excel')
  async getAssignmentReportExcel(@Query() query: AssignmentReportQueryDto, @CurrentUser() user: any, @Res() res: Response) {
    const data = await this.reportsService.getAssignmentReport(query, user);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="assignments-report-${Date.now()}.xlsx"`);
    await this.excelExportService.generateAssignmentsExcel(data, res);
  }

  // ---------------------------------------------------------
  // DISPATCHES
  // ---------------------------------------------------------
  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get('dispatches')
  getDispatchReport(@Query() query: DispatchReportQueryDto, @CurrentUser() user: any) {
    return this.reportsService.getDispatchReport(query, user);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get('dispatches/pdf')
  async getDispatchReportPdf(@Query() query: DispatchReportQueryDto, @CurrentUser() user: any, @Res() res: Response) {
    const data = await this.reportsService.getDispatchReport(query, user);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="dispatches-report-${Date.now()}.pdf"`);
    this.pdfExportService.generateDispatchesPdf(data, res);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get('dispatches/excel')
  async getDispatchReportExcel(@Query() query: DispatchReportQueryDto, @CurrentUser() user: any, @Res() res: Response) {
    const data = await this.reportsService.getDispatchReport(query, user);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="dispatches-report-${Date.now()}.xlsx"`);
    await this.excelExportService.generateDispatchesExcel(data, res);
  }

  // ---------------------------------------------------------
  // MAINTENANCE
  // ---------------------------------------------------------
  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get('maintenance')
  getMaintenanceReport(@Query() query: MaintenanceReportQueryDto, @CurrentUser() user: any) {
    return this.reportsService.getMaintenanceReport(query, user);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get('maintenance/pdf')
  async getMaintenanceReportPdf(@Query() query: MaintenanceReportQueryDto, @CurrentUser() user: any, @Res() res: Response) {
    const data = await this.reportsService.getMaintenanceReport(query, user);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="maintenance-report-${Date.now()}.pdf"`);
    this.pdfExportService.generateMaintenancePdf(data, res);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get('maintenance/excel')
  async getMaintenanceReportExcel(@Query() query: MaintenanceReportQueryDto, @CurrentUser() user: any, @Res() res: Response) {
    const data = await this.reportsService.getMaintenanceReport(query, user);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="maintenance-report-${Date.now()}.xlsx"`);
    await this.excelExportService.generateMaintenanceExcel(data, res);
  }
}
