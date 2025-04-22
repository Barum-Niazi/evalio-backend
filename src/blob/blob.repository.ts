import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BlobRepository {
  constructor(private readonly prisma: PrismaService) {}

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
