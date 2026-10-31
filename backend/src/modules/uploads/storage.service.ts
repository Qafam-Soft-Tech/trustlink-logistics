import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as crypto from 'crypto';

export abstract class StorageService {
  abstract save(buffer: Buffer, mimeType: string): Promise<string>;
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || join(process.cwd(), 'uploads');
  }

  async save(buffer: Buffer, mimeType: string): Promise<string> {
    const extension = EXTENSIONS[mimeType];
    if (!extension) {
      throw new Error(`Unsupported mime type: ${mimeType}`);
    }

    await fs.mkdir(this.uploadDir, { recursive: true });
    const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    await fs.writeFile(join(this.uploadDir, filename), buffer);
    this.logger.log(`Stored upload ${filename}`);
    return `/uploads/${filename}`;
  }
}

@Injectable()
export class S3StorageService extends StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.bucket = this.configService.get<string>('S3_BUCKET') || '';
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const region = this.configService.get<string>('S3_REGION') || 'auto';
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY_ID') || '';
    const secretAccessKey = this.configService.get<string>('S3_SECRET_ACCESS_KEY') || '';
    this.publicBaseUrl = this.configService.get<string>('S3_PUBLIC_BASE_URL') || '';

    this.client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      forcePathStyle: Boolean(endpoint),
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async save(buffer: Buffer, mimeType: string): Promise<string> {
    if (!this.bucket || !this.publicBaseUrl) {
      throw new Error('S3_BUCKET and S3_PUBLIC_BASE_URL are required when STORAGE_DRIVER=s3');
    }

    const extension = EXTENSIONS[mimeType];
    if (!extension) {
      throw new Error(`Unsupported mime type: ${mimeType}`);
    }

    const key = `uploads/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }));

    this.logger.log(`Uploaded ${key} to ${this.bucket}`);
    return `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
  }
}

export const storageProvider = {
  provide: StorageService,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): StorageService => {
    const driver = (configService.get<string>('STORAGE_DRIVER') || 'local').toLowerCase();
    return driver === 's3'
      ? new S3StorageService(configService)
      : new LocalStorageService(configService);
  },
};
