import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { BlobService } from './blob.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('blob')
export class BlobController {
  constructor(private readonly blobService: BlobService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id/view')
  async getBlob(@Param('id') id: string, @Res() res: Response) {
    const blobId = parseInt(id, 10);
    const { stream, mimeType } = await this.blobService.getBlobStream(blobId);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': 'inline',
    });

    stream.pipe(res);
  }
}
