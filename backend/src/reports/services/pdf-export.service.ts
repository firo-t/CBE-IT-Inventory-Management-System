import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class PdfExportService {
  generateInventoryPdf(data: any[], res: any) {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    doc.pipe(res);

    this.addHeader(doc, 'Inventory Report');
    this.addTable(
      doc,
      ['Tag No', 'Type', 'Status', 'Branch'],
      data.map((item) => [
        item.tag_no,
        item.asset_type?.type_name || 'N/A',
        item.status,
        item.current_branch?.branch_name || 'N/A',
      ])
    );
    doc.end();
  }

  generateAssignmentsPdf(data: any[], res: any) {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    doc.pipe(res);

    this.addHeader(doc, 'Assignments Report');
    this.addTable(
      doc,
      ['Asset Tag', 'Employee', 'Assigned Date', 'Status'],
      data.map((item) => [
        item.asset?.tag_no || 'N/A',
        item.employee_name,
        new Date(item.assigned_date).toLocaleDateString(),
        item.status,
      ])
    );
    doc.end();
  }

  generateDispatchesPdf(data: any[], res: any) {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    doc.pipe(res);

    this.addHeader(doc, 'Dispatches Report');
    this.addTable(
      doc,
      ['Asset Tag', 'Destination', 'Date', 'Status'],
      data.map((item) => [
        item.asset?.tag_no || 'N/A',
        item.destination_branch?.branch_name || 'N/A',
        new Date(item.dispatched_date).toLocaleDateString(),
        item.status,
      ])
    );
    doc.end();
  }

  generateMaintenancePdf(data: any[], res: any) {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    doc.pipe(res);

    this.addHeader(doc, 'Maintenance Report');
    this.addTable(
      doc,
      ['Asset Tag', 'Priority', 'Date', 'Status'],
      data.map((item) => [
        item.asset?.tag_no || 'N/A',
        item.priority,
        new Date(item.reported_date).toLocaleDateString(),
        item.status,
      ])
    );
    doc.end();
  }

  private addHeader(doc: typeof PDFDocument, title: string) {
    doc.fontSize(20).text(`CBE Inventory Management System`, { align: 'center' });
    doc.fontSize(16).text(title, { align: 'center' });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);
  }

  private addTable(doc: typeof PDFDocument, headers: string[], rows: any[][]) {
    const startX = 30;
    let y = doc.y;
    const colWidth = (doc.page.width - 60) / headers.length;

    // Headers
    doc.font('Helvetica-Bold').fontSize(10);
    headers.forEach((header, i) => {
      doc.text(header, startX + i * colWidth, y, { width: colWidth, align: 'left' });
    });
    y += 15;
    doc.moveTo(startX, y - 2).lineTo(doc.page.width - 30, y - 2).stroke();

    // Rows
    doc.font('Helvetica').fontSize(9);
    rows.forEach((row) => {
      // Check pagination
      if (y > doc.page.height - 50) {
        doc.addPage();
        y = 30;
      }
      row.forEach((cell, i) => {
        doc.text(cell?.toString() || '', startX + i * colWidth, y, { width: colWidth, align: 'left' });
      });
      y += 15;
    });
  }
}
