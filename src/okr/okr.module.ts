import { Module } from '@nestjs/common';
import { OkrController } from './okr.controller';
import { OkrService } from './okr.service';
import { OkrRepository } from './okr.repository';
import { PrismaService } from 'src/prisma/prisma.service';
@Module({
  controllers: [OkrController],
  providers: [OkrService, OkrRepository, PrismaService],
})
export class OkrModule {}
