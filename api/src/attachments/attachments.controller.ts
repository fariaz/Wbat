import {
  Controller, Get, Post, Delete,
  Param, Query, UseGuards, Request,
  ParseIntPipe, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AttachmentsService } from './attachments.service';

@UseGuards(JwtAuthGuard)
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly svc: AttachmentsService) {}

  @Get()
  findAll(@Request() req, @Query('invoiceId') invoiceId?: string) {
    return this.svc.findAll(req.user.companyId, invoiceId ? +invoiceId : undefined);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Query('invoiceId') invoiceId?: string,
  ) {
    return this.svc.save(req.user.companyId, file, invoiceId ? +invoiceId : undefined);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id, req.user.companyId);
  }
}
