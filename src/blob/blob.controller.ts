import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { BlobService } from './blob.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('blob')
export class BlobController {
  constructor(private readonly blobService: BlobService) {}

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

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBlob(@UploadedFile() file: Express.Multer.File) {
    return this.blobService.uploadBlob(file);
  }
}
