import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { OkrService } from './okr.service';
import {
  CreateOkrDto,
  GetOkrDto,
  UpdateOkrDto,
  DeleteOkrDto,
} from './dto/okr.dto';

@Controller('okrs')
export class OkrController {
  constructor(private readonly okrService: OkrService) {}

  @Post()
  create(@Body() dto: CreateOkrDto) {
    return this.okrService.createOkr(dto);
  }

  @Get()
  getAll() {
    return this.okrService.getAllOkrs();
  }

  @Get(':okrId')
  getOne(@Param() dto: GetOkrDto) {
    return this.okrService.getOkr(dto);
  }

  @Patch()
  update(@Body() dto: UpdateOkrDto) {
    return this.okrService.updateOkr(dto);
  }

  @Delete()
  delete(@Body() dto: DeleteOkrDto) {
    return this.okrService.deleteOkr(dto);
  }
}
