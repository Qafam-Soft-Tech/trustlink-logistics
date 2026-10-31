import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { Request } from 'express';

import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER, UserRole.RIDER, UserRole.ADMIN)
@ApiBearerAuth()
export class UploadsController {
  constructor(private storageService: StorageService) {}

  @Post()
  @ApiOperation({ summary: 'Upload an image (KYC document or proof of delivery)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  async upload(@UploadedFile() file: Express.Multer.File, @Req() request: Request) {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG or WebP images are allowed');
    }

    const storedUrl = await this.storageService.save(file.buffer, file.mimetype);
    if (storedUrl.startsWith('/')) {
      const baseUrl = process.env.PUBLIC_BASE_URL || `${request.protocol}://${request.get('host')}`;
      return { url: `${baseUrl.replace(/\/$/, '')}${storedUrl}` };
    }
    return { url: storedUrl };
  }
}
