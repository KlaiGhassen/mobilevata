import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { detectImageType } from '../../common/security/image-magic';

@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly logger = new Logger(UploadsService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBase: string;
  private ready = false;

  constructor(private readonly config: ConfigService) {
    const endpoint =
      this.config.get<string>('MINIO_ENDPOINT') || 'http://127.0.0.1:9000';
    const accessKey = this.config.get<string>('MINIO_ACCESS_KEY');
    const secretKey = this.config.get<string>('MINIO_SECRET_KEY');
    if (!accessKey || !secretKey) {
      this.logger.warn(
        'MINIO_ACCESS_KEY / MINIO_SECRET_KEY missing — uploads disabled until set',
      );
    }
    this.bucket =
      this.config.get<string>('MINIO_BUCKET') || 'autovia-vehicles';
    this.publicBase = (
      this.config.get<string>('MINIO_PUBLIC_URL') || endpoint
    ).replace(/\/$/, '');

    this.client = new S3Client({
      endpoint,
      region: this.config.get<string>('MINIO_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: accessKey || 'missing',
        secretAccessKey: secretKey || 'missing',
      },
      forcePathStyle: true,
    });
  }

  async onModuleInit() {
    try {
      await this.ensureBucket();
      this.ready = true;
      this.logger.log(`MinIO ready (bucket: ${this.bucket})`);
    } catch (err) {
      this.ready = false;
      this.logger.error(
        `MinIO unavailable — image uploads will fail until it is up: ${
          err instanceof Error ? err.message : err
        }`,
      );
    }
  }

  private async ensureBucket() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Created MinIO bucket ${this.bucket}`);
    }

    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        },
      ],
    };

    await this.client.send(
      new PutBucketPolicyCommand({
        Bucket: this.bucket,
        Policy: JSON.stringify(policy),
      }),
    );
  }

  private publicUrl(key: string) {
    return `${this.publicBase}/${this.bucket}/${key}`;
  }

  async uploadImages(files: Express.Multer.File[]): Promise<string[]> {
    if (!this.ready) {
      try {
        await this.ensureBucket();
        this.ready = true;
      } catch {
        throw new ServiceUnavailableException(
          'Image storage is unavailable. Start MinIO (docker compose up -d).',
        );
      }
    }

    const urls: string[] = [];
    for (const file of files) {
      const detected = detectImageType(file.buffer);
      const key = `vehicles/${randomUUID()}${detected.ext}`;
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: detected.mime,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
      urls.push(this.publicUrl(key));
    }
    return urls;
  }
}
