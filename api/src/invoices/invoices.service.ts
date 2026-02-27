import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import PDFDocument from 'pdfkit';
import { Invoice } from './invoice.entity';
import { InvoiceItem } from './invoice-item.entity';

@Injectable()
export class InvoicesService {
  private readonly pdfDir: string;

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly itemRepo: Repository<InvoiceItem>,
    private readonly dataSource: DataSource,
  ) {
    this.pdfDir = process.env.ATTACHMENTS_PATH || '/attachments';
    fs.mkdirSync(path.join(this.pdfDir, 'invoices'), { recursive: true });
  }

  async findAll(companyId: number, status?: string) {
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.customer', 'customer')
      .leftJoinAndSelect('inv.items', 'items')
      .where('inv.company_id = :companyId', { companyId })
      .orderBy('inv.created_at', 'DESC');
    if (status) qb.andWhere('inv.status = :status', { status });
    return qb.getMany();
  }

  async findOne(id: number, companyId: number) {
    const inv = await this.invoiceRepo.findOne({
      where: { id, companyId },
      relations: ['customer', 'items', 'company'],
    });
    if (!inv) throw new NotFoundException('Invoice not found');
    return inv;
  }

  async create(companyId: number, data: any) {
    const { items = [], ...invoiceData } = data;

    // Auto-generate invoice number if not provided
    if (!invoiceData.invoiceNumber) {
      const count = await this.invoiceRepo.count({ where: { companyId } });
      invoiceData.invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`;
    }

    const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const taxAmount = subtotal * ((invoiceData.taxRate || 0) / 100);
    const total = subtotal + taxAmount;

    const invoice = this.invoiceRepo.create({
      ...invoiceData,
      companyId,
      subtotal,
      taxAmount,
      total,
      items: items.map((item, idx) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.quantity * item.unitPrice,
        sortOrder: idx,
      })),
    });

    return this.invoiceRepo.save(invoice);
  }

  async update(id: number, companyId: number, data: any) {
    const inv = await this.findOne(id, companyId);
    const { items, ...invoiceData } = data;

    if (items !== undefined) {
      await this.itemRepo.delete({ invoiceId: id });
      const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
      const taxAmount = subtotal * ((invoiceData.taxRate ?? inv.taxRate) / 100);
      const total = subtotal + taxAmount;
      invoiceData.subtotal = subtotal;
      invoiceData.taxAmount = taxAmount;
      invoiceData.total = total;
      invoiceData.items = items.map((item, idx) => ({
        invoiceId: id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.quantity * item.unitPrice,
        sortOrder: idx,
      }));
    }

    await this.invoiceRepo.save({ ...inv, ...invoiceData });
    return this.findOne(id, companyId);
  }

  async remove(id: number, companyId: number) {
    await this.findOne(id, companyId);
    await this.invoiceRepo.delete(id);
    return { deleted: true };
  }

  async generatePdf(id: number, companyId: number): Promise<Buffer> {
    const inv = await this.findOne(id, companyId);
    return new Promise((resolve, reject) => {
      const buffers: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50, size: 'A4' });

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text(inv.company?.name || 'Company', 50, 50);
      doc.fontSize(10).font('Helvetica').fillColor('#555')
        .text(inv.company?.address || '', 50, 80)
        .text(inv.company?.email || '', 50, 95)
        .text(inv.company?.phone || '', 50, 110);

      doc.fontSize(20).font('Helvetica-Bold').fillColor('#000')
        .text('INVOICE', 400, 50, { align: 'right' });
      doc.fontSize(10).font('Helvetica').fillColor('#555')
        .text(`#${inv.invoiceNumber}`, 400, 80, { align: 'right' })
        .text(`Issue: ${inv.issueDate}`, 400, 95, { align: 'right' })
        .text(`Due: ${inv.dueDate}`, 400, 110, { align: 'right' });

      // Status badge
      const statusColor = {
        draft: '#94a3b8', sent: '#3b82f6', paid: '#22c55e',
        overdue: '#ef4444', cancelled: '#6b7280',
      }[inv.status] || '#94a3b8';
      doc.fillColor(statusColor).fontSize(10).font('Helvetica-Bold')
        .text(inv.status.toUpperCase(), 400, 125, { align: 'right' });

      // Bill to
      doc.fillColor('#000').fontSize(10).font('Helvetica-Bold')
        .text('BILL TO', 50, 155);
      doc.font('Helvetica').fillColor('#333')
        .text(inv.customer?.name || '', 50, 170)
        .text(inv.customer?.address || '', 50, 185)
        .text(inv.customer?.email || '', 50, 200);

      // Table header
      doc.fillColor('#1e293b').rect(50, 235, 495, 22).fill();
      doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold')
        .text('DESCRIPTION', 60, 241)
        .text('QTY', 330, 241, { width: 50, align: 'right' })
        .text('UNIT PRICE', 390, 241, { width: 70, align: 'right' })
        .text('TOTAL', 470, 241, { width: 65, align: 'right' });

      // Items
      let y = 257;
      doc.fillColor('#000').font('Helvetica').fontSize(9);
      inv.items?.forEach((item, i) => {
        if (i % 2 === 0) {
          doc.fillColor('#f8fafc').rect(50, y, 495, 20).fill();
        }
        doc.fillColor('#333')
          .text(item.description, 60, y + 5, { width: 260 })
          .text(String(item.quantity), 330, y + 5, { width: 50, align: 'right' })
          .text(`€${Number(item.unitPrice).toFixed(2)}`, 390, y + 5, { width: 70, align: 'right' })
          .text(`€${Number(item.lineTotal).toFixed(2)}`, 470, y + 5, { width: 65, align: 'right' });
        y += 20;
      });

      // Totals
      y += 15;
      doc.moveTo(350, y).lineTo(545, y).strokeColor('#e2e8f0').stroke();
      y += 10;
      doc.fillColor('#333').fontSize(9)
        .text('Subtotal', 350, y, { width: 130, align: 'right' })
        .text(`€${Number(inv.subtotal).toFixed(2)}`, 490, y, { width: 55, align: 'right' });
      y += 18;
      doc.text(`Tax (${inv.taxRate}%)`, 350, y, { width: 130, align: 'right' })
        .text(`€${Number(inv.taxAmount).toFixed(2)}`, 490, y, { width: 55, align: 'right' });
      y += 10;
      doc.moveTo(350, y).lineTo(545, y).strokeColor('#1e293b').stroke();
      y += 10;
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#000')
        .text('TOTAL', 350, y, { width: 130, align: 'right' })
        .text(`€${Number(inv.total).toFixed(2)}`, 490, y, { width: 55, align: 'right' });

      // Notes
      if (inv.notes) {
        y += 40;
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#555').text('NOTES', 50, y);
        doc.font('Helvetica').fillColor('#333').text(inv.notes, 50, y + 14, { width: 495 });
      }

      // Footer
      doc.fontSize(8).fillColor('#94a3b8')
        .text('Thank you for your business.', 50, 760, { align: 'center', width: 495 });

      doc.end();
    });
  }

  async getDashboardStats(companyId: number) {
    const [all, totalResult] = await Promise.all([
      this.invoiceRepo.find({ where: { companyId } }),
      this.invoiceRepo
        .createQueryBuilder('inv')
        .select('SUM(inv.total)', 'total')
        .addSelect('SUM(CASE WHEN inv.status = \'paid\' THEN inv.total ELSE 0 END)', 'paid')
        .addSelect('SUM(CASE WHEN inv.status = \'sent\' THEN inv.total ELSE 0 END)', 'outstanding')
        .addSelect('SUM(CASE WHEN inv.status = \'overdue\' THEN inv.total ELSE 0 END)', 'overdue')
        .where('inv.company_id = :companyId', { companyId })
        .getRawOne(),
    ]);

    const byStatus = {};
    all.forEach((inv) => {
      byStatus[inv.status] = (byStatus[inv.status] || 0) + 1;
    });

    return {
      totalInvoices: all.length,
      byStatus,
      totals: totalResult,
    };
  }
}
