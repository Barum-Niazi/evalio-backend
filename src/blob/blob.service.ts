import { Injectable, StreamableFile } from '@nestjs/common';
import { BlobRepository } from './blob.repository';
import { Readable } from 'stream';

@Injectable()
export class BlobService {
  constructor(private readonly blobRepository: BlobRepository) {}

  async getBlobStream(
    blobId: number,
  ): Promise<{ stream: Readable; mimeType: string }> {
    const blob = await this.blobRepository.findById(blobId);

    const buffer = Buffer.from(blob.data);
    const stream = Readable.from(buffer);

    return {
      stream,
      mimeType: blob.mime_type,
    };
  }

  async getBlobMetadata(blobId: number) {
    const blob = await this.blobRepository.findById(blobId);

    return {
      id: blob.id,
      name: blob.name,
      mimeType: blob.mime_type,
      size: blob.size,
    };
  }

  async uploadBlob(file: Express.Multer.File) {
    const { originalname, mimetype, buffer, size } = file;

    const blob = await this.blobRepository.createBlob({
      name: originalname,
      mime_type: mimetype,
      size,
      buffer,
    });

    return {
      id: blob.id,
      name: blob.name,
      mimeType: blob.mime_type,
      size: blob.size,
    };
  }
}
