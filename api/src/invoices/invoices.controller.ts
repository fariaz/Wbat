import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, Request,
  ParseIntPipe, Res, HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InvoicesService } from './invoices.service';

@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly svc: InvoicesService) {}

  @Get('stats')
  stats(@Request() req) {
    return this.svc.getDashboardStats(req.user.companyId);
  }

  @Get()
  findAll(@Request() req, @Query('status') status?: string) {
    return this.svc.findAll(req.user.companyId, status);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id, req.user.companyId);
  }

  @Post()
  create(@Request() req, @Body() body) {
    return this.svc.create(req.user.companyId, body);
  }

  @Patch(':id')
  update(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() body) {
    return this.svc.update(id, req.user.companyId, body);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id, req.user.companyId);
  }

  @Get(':id/pdf')
  async pdf(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const buffer = await this.svc.generatePdf(id, req.user.companyId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.status(HttpStatus.OK).end(buffer);
  }
}
