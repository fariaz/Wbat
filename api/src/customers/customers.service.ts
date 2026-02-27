import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Customer } from './customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  findAll(companyId: number, search?: string) {
    const where: any = { companyId };
    if (search) where.name = Like(`%${search}%`);
    return this.repo.find({ where, order: { name: 'ASC' } });
  }

  async findOne(id: number, companyId: number) {
    const c = await this.repo.findOne({ where: { id, companyId } });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  create(companyId: number, data: Partial<Customer>) {
    const c = this.repo.create({ ...data, companyId });
    return this.repo.save(c);
  }

  async update(id: number, companyId: number, data: Partial<Customer>) {
    await this.findOne(id, companyId);
    await this.repo.update(id, data);
    return this.findOne(id, companyId);
  }

  async remove(id: number, companyId: number) {
    await this.findOne(id, companyId);
    await this.repo.delete(id);
    return { deleted: true };
  }
}
