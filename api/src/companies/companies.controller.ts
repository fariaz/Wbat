import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CompaniesService } from './companies.service';

@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly svc: CompaniesService) {}

  @Get('me')
  getMyCompany(@Request() req) {
    return this.svc.findOne(req.user.companyId);
  }

  @Patch('me')
  updateMyCompany(@Request() req, @Body() body) {
    return this.svc.update(req.user.companyId, body);
  }
}
