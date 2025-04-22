import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BlobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createBlob(data: {
    name: string;
    mime_type: string;
    size: number;
    buffer: Buffer;
  }) {
    return this.prisma.blob.create({
      data: {
        name: data.name,
        mime_type: data.mime_type,
        size: data.size,
        data: data.buffer,
        audit: {},
      },
    });
  }

  async findById(blobId: number) {
    const blob = await this.prisma.blob.findUnique({
      where: { id: blobId },
    });

    if (!blob) {
      throw new NotFoundException('Blob not found');
    }

    return blob;
  }
}
