import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { CustomersModule } from './customers/customers.module';
import { InvoicesModule } from './invoices/invoices.module';
import { AttachmentsModule } from './attachments/attachments.module';

import { Company } from './companies/company.entity';
import { User } from './auth/user.entity';
import { Customer } from './customers/customer.entity';
import { Invoice } from './invoices/invoice.entity';
import { InvoiceItem } from './invoices/invoice-item.entity';
import { Attachment } from './attachments/attachment.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'db',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USER || 'wbat',
      password: process.env.DB_PASS || 'wbat',
      database: process.env.DB_NAME || 'wbat',
      entities: [Company, User, Customer, Invoice, InvoiceItem, Attachment],
      synchronize: false,
      retryAttempts: 10,
      retryDelay: 3000,
    }),
    AuthModule,
    CompaniesModule,
    CustomersModule,
    InvoicesModule,
    AttachmentsModule,
  ],
})
export class AppModule {}
