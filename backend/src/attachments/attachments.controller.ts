import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFile, BadRequestException, Res, StreamableFile } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { CreateAttachmentDto, AttachmentQueryDto } from './dto/attachment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { Response } from 'express';

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads', { recursive: true });
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => cb(null, `${uuidv4()}${extname(file.originalname)}`)
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = [
        'image/jpeg', 
        'image/png', 
        'application/pdf', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'text/plain'
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new BadRequestException('Unsupported file type'), false);
      }
      cb(null, true);
    }
  }))
  create(
    @UploadedFile() file: Express.Multer.File, 
    @Body() createAttachmentDto: CreateAttachmentDto, 
    @CurrentUser() user: any
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.attachmentsService.create(file, createAttachmentDto, user);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get()
  findAll(@Query() query: AttachmentQueryDto, @CurrentUser() user: any) {
    return this.attachmentsService.findAll(query, user);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.attachmentsService.findOne(id, user);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Get(':id/download')
  async download(@Param('id') id: string, @CurrentUser() user: any, @Res({ passthrough: true }) res: Response) {
    const { stream, file_name, file_type } = await this.attachmentsService.download(id, user);
    
    res.set({
      'Content-Type': file_type,
      'Content-Disposition': `attachment; filename="${file_name}"`,
    });
    
    return new StreamableFile(stream);
  }

  @Roles('System Administrator / Admin', 'IT Inventory Officer', 'Branch Manager', 'Hardware Technician')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.attachmentsService.remove(id, user);
  }
}
