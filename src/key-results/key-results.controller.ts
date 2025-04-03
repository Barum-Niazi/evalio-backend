import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { KeyResultsService } from './key-results.service';
import {
  CreateKeyResultDto,
  GetKeyResultDto,
  UpdateKeyResultDto,
  DeleteKeyResultDto,
} from './dto/key-results.dto';

@Controller('key-results')
export class KeyResultsController {
  constructor(private readonly service: KeyResultsService) {}

  @Post()
  create(@Body() dto: CreateKeyResultDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  getOne(@Param() dto: GetKeyResultDto) {
    return this.service.getOne(dto);
  }

  @Get('okr/:okrId')
  getAllByOkr(@Param('okrId') okrId: number) {
    return this.service.getAllByOkr(okrId);
  }

  @Patch()
  update(@Body() dto: UpdateKeyResultDto) {
    return this.service.update(dto);
  }

  @Delete()
  delete(@Body() dto: DeleteKeyResultDto) {
    return this.service.delete(dto);
  }
}
