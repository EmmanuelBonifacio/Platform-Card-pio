import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import * as Minio from 'minio';

const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const MAX_BYTES = 5 * 1024 * 1024;

@Injectable()
export class UploadsService {
  private minio: Minio.Client | null = null;

  constructor(private readonly config: ConfigService) {
    const endpoint = config.get<string>('MINIO_ENDPOINT');
    const driver = config.get<string>('UPLOAD_DRIVER') ?? 'local';
    if (driver === 'minio' && endpoint) {
      const url = new URL(endpoint);
      this.minio = new Minio.Client({
        endPoint: url.hostname,
        port: Number(url.port || (url.protocol === 'https:' ? 443 : 9000)),
        useSSL: url.protocol === 'https:',
        accessKey: config.getOrThrow<string>('MINIO_ACCESS_KEY'),
        secretKey: config.getOrThrow<string>('MINIO_SECRET_KEY'),
      });
    }
  }

  async saveImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{ url: string; key: string }> {
    if (!file?.mimetype || !ALLOWED.has(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não permitido');
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('Arquivo maior que 5MB');
    }

    const ext = extname(file.originalname || '').toLowerCase() || '.jpg';
    const key = `${folder}/${randomUUID()}${ext}`;

    if (this.minio) {
      const bucket = this.config.get<string>('MINIO_BUCKET') ?? 'platform-cardapio';
      const exists = await this.minio.bucketExists(bucket).catch(() => false);
      if (!exists) await this.minio.makeBucket(bucket, 'us-east-1');
      await this.minio.putObject(bucket, key, file.buffer, file.size, {
        'Content-Type': file.mimetype,
      });
      const endpoint = this.config.getOrThrow<string>('MINIO_ENDPOINT');
      return { url: `${endpoint}/${bucket}/${key}`, key };
    }

    const root =
      this.config.get<string>('UPLOAD_DIR') ??
      join(process.cwd(), 'uploads');
    const absDir = join(root, folder);
    if (!existsSync(absDir)) mkdirSync(absDir, { recursive: true });
    const abs = join(root, key);
    await pipeline(Readable.from(file.buffer), createWriteStream(abs));
    return { url: `/uploads/${key}`, key };
  }
}
