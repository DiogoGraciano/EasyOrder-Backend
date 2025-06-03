import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

export const getR2Config = (configService: ConfigService) => {
  const endpoint = configService.get<string>('R2_ENDPOINT');
  const accessKeyId = configService.get<string>('R2_ACCESS_KEY_ID');
  const secretAccessKey = configService.get<string>('R2_SECRET_ACCESS_KEY');

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2 configuration is incomplete. Please check your environment variables.',
    );
  }

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};
