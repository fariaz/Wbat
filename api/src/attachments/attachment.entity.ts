import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Company } from '../companies/company.entity';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ name: 'company_id', unsigned: true })
  companyId: number;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'invoice_id', nullable: true })
  invoiceId: number;

  @Column({ name: 'original_name' })
  originalName: string;

  @Column({ name: 'stored_path' })
  storedPath: string;

  @Column({ name: 'mime_type', nullable: true })
  mimeType: string;

  @Column({ name: 'file_size', nullable: true })
  fileSize: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
