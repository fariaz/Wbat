import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from './attachment.entity';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly repo: Repository<Attachment>,
  ) {}

  findAll(companyId: number, invoiceId?: number) {
    const where: any = { companyId };
    if (invoiceId) where.invoiceId = invoiceId;
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async save(companyId: number, file: Express.Multer.File, invoiceId?: number) {
    const att = this.repo.create({
      companyId,
      invoiceId: invoiceId || null,
      originalName: file.originalname,
      storedPath: file.path,
      mimeType: file.mimetype,
      fileSize: file.size,
    });
    return this.repo.save(att);
  }

  async remove(id: number, companyId: number) {
    const att = await this.repo.findOne({ where: { id, companyId } });
    if (!att) throw new NotFoundException('Attachment not found');
    const fs = require('fs');
    if (fs.existsSync(att.storedPath)) fs.unlinkSync(att.storedPath);
    await this.repo.delete(id);
    return { deleted: true };
  }
}
