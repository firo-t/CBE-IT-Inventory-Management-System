import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExcelExportService {
  async generateInventoryExcel(data: any[], res: any) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Inventory');
    
    sheet.columns = [
      { header: 'Tag No', key: 'tag_no', width: 20 },
      { header: 'Type', key: 'type', width: 20 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Branch', key: 'branch', width: 25 },
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    data.forEach(item => {
      sheet.addRow({
        tag_no: item.tag_no,
        type: item.asset_type?.type_name || 'N/A',
        status: item.status,
        branch: item.current_branch?.branch_name || 'N/A',
      });
    });

    await workbook.xlsx.write(res);
  }

  async generateAssignmentsExcel(data: any[], res: any) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Assignments');
    
    sheet.columns = [
      { header: 'Asset Tag', key: 'tag', width: 20 },
      { header: 'Employee', key: 'employee', width: 30 },
      { header: 'Assigned Date', key: 'date', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    data.forEach(item => {
      sheet.addRow({
        tag: item.asset?.tag_no || 'N/A',
        employee: item.employee_name,
        date: new Date(item.assigned_date).toLocaleDateString(),
        status: item.status,
      });
    });

    await workbook.xlsx.write(res);
  }

  async generateDispatchesExcel(data: any[], res: any) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Dispatches');
    
    sheet.columns = [
      { header: 'Asset Tag', key: 'tag', width: 20 },
      { header: 'Destination', key: 'dest', width: 25 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    data.forEach(item => {
      sheet.addRow({
        tag: item.asset?.tag_no || 'N/A',
        dest: item.destination_branch?.branch_name || 'N/A',
        date: new Date(item.dispatched_date).toLocaleDateString(),
        status: item.status,
      });
    });

    await workbook.xlsx.write(res);
  }

  async generateMaintenanceExcel(data: any[], res: any) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Maintenance');
    
    sheet.columns = [
      { header: 'Asset Tag', key: 'tag', width: 20 },
      { header: 'Priority', key: 'priority', width: 15 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Status', key: 'status', width: 20 },
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    data.forEach(item => {
      sheet.addRow({
        tag: item.asset?.tag_no || 'N/A',
        priority: item.priority,
        date: new Date(item.reported_date).toLocaleDateString(),
        status: item.status,
      });
    });

    await workbook.xlsx.write(res);
  }
}
