import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { KeyResultsService } from './key-results.service';
import { CreateKeyResultDto, UpdateKeyResultDto } from './dto/key-results.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('key-results')
export class KeyResultsController {
  constructor(private readonly keyResultsService: KeyResultsService) {}

  @Post()
  async create(
    @Body() body: CreateKeyResultDto | CreateKeyResultDto[],
    @Request() req,
  ) {
    if (Array.isArray(body)) {
      return this.keyResultsService.createMany(body, req.user);
    }

    return this.keyResultsService.create(body, req.user);
  }

  // @Get(':id')
  // getOne(@Param() dto: GetKeyResultDto) {
  //   return this.keyResultsService.getOne(dto);
  // }

  @Get('okr/:okrId')
  getAllByOkr(@Param('okrId') okrId: number) {
    return this.keyResultsService.getAllByOkr(okrId);
  }
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateKeyResultDto,
    @Request() req,
  ) {
    return this.keyResultsService.update(id, dto, {
      id: req.user.id,
      roles: req.roles,
    });
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.keyResultsService.delete(id);
  }
}
