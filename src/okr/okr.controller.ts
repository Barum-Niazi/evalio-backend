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

  @Get('tree/:id')
  getChildren(@Param('id', ParseIntPipe) id: number) {
    return this.okrService.getSubTree(id);
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
