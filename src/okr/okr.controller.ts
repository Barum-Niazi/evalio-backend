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
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get('user-okr-count')
  getUserOkrCount(@Request() req) {
    return this.okrService.getUserOkrCount(req.user.companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get('avg-progress-per-okr')
  getAvgProgressPerOkr(@Request() req) {
    return this.okrService.getAvgProgressPerOkr(req.user.companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get('department-okr-count')
  getOkrCountByDepartment(@Request() req) {
    return this.okrService.getOkrCountByDepartment(req.user.companyId);
  }

  @Get('empty-okrs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  getOkrsWithNoKeyResults(@Request() req) {
    return this.okrService.getOkrsWithNoKeyResults(req.user.companyId);
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
