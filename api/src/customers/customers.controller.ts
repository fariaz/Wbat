import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, Request, ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomersService } from './customers.service';

@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly svc: CustomersService) {}

  @Get()
  findAll(@Request() req, @Query('search') search?: string) {
    return this.svc.findAll(req.user.companyId, search);
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
}
