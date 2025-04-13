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
  create(@Body() dto: CreateKeyResultDto, @Request() req) {
    return this.keyResultsService.create(dto, req.user); // pass current user
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
    return this.keyResultsService.update(id, dto, req.user.user_id);
  }

  // @Delete()
  // delete(@Body() dto: DeleteKeyResultDto) {
  //   return this.keyResultsService.delete(dto);
  // }
}
