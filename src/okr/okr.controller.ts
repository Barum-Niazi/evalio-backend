import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  ParseIntPipe,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { OkrService } from './okr.service';
import { CreateOkrDto, UpdateOkrDto } from './dto/okr.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('okrs')
export class OkrController {
  constructor(private readonly okrService: OkrService) {}

  @Post()
  create(@Body() dto: CreateOkrDto, @Request() req) {
    console.log(req.user);
    dto.companyId = req.user.companyId;
    dto.userId = req.user.id;
    return this.okrService.create(dto);
  }

  @Get()
  findAll(@Request() req) {
    return this.okrService.findAllForCompany(req.user.companyId);
  }

  @Get('root')
  getRootOkrs() {
    return this.okrService.getRootOkrs();
  }

  @Get('progress-breakdown')
  getProgressBreakdown(@Request() req) {
    return this.okrService.getProgressBreakdown(req.user.companyId);
  }

  @Get('achievement-trends')
  getOkrAchievementTrends(
    @Request() req,
    @Query('groupBy') groupBy: 'day' | 'week' | 'month' | 'year' = 'week',
  ) {
    return this.okrService.getOkrAchievementTrends(req.user.companyId, groupBy);
  }

  @Get('tree/:id')
  getChildren(@Param('id', ParseIntPipe) id: number) {
    return this.okrService.getSubTree(id);
  }

  @Get('user/:userId')
  getOkrsByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.okrService.getByUser(userId);
  }

  @Get('department/:departmentId')
  getOkrsByDepartment(
    @Param('departmentId', ParseIntPipe) departmentId: number,
  ) {
    return this.okrService.getByDepartment(departmentId);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    console.log('in find one');
    return this.okrService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOkrDto,
    @Request() req,
  ) {
    return this.okrService.update(id, dto, {
      id: req.user.id,
      role: req.user.role,
    });
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.okrService.delete(+id);
  }
}
