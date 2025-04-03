import { Injectable, NotFoundException } from '@nestjs/common';
import { OkrRepository } from './okr.repository';
import {
  CreateOkrDto,
  UpdateOkrDto,
  GetOkrDto,
  DeleteOkrDto,
} from './dto/okr.dto';
// import { TagService } from '../tag/tag.service';

@Injectable()
export class OkrService {
  constructor(
    private readonly okrRepository: OkrRepository,
    // private readonly tagService: TagService,
  ) {}

  async createOkr(dto: CreateOkrDto) {
    const okr = await this.okrRepository.createOkr(dto);

    // // Auto-create tag from OKR title
    // await this.tagService.autoCreateTagForEntity({
    //   entityId: okr.id,
    //   entityType: 'okr',
    //   entityName: okr.title,
    // });

    return okr;
  }

  async getOkr(dto: GetOkrDto) {
    const okr = await this.okrRepository.getOkrById(dto.okrId);
    if (!okr) throw new NotFoundException('OKR not found');
    return okr;
  }

  async getAllOkrs() {
    return this.okrRepository.getAllOkrs();
  }

  async updateOkr(dto: UpdateOkrDto) {
    const okr = await this.okrRepository.getOkrById(dto.okrId);
    if (!okr) throw new NotFoundException('OKR not found');
    return this.okrRepository.updateOkr(dto);
  }

  async deleteOkr(dto: DeleteOkrDto) {
    const okr = await this.okrRepository.getOkrById(dto.okrId);
    if (!okr) throw new NotFoundException('OKR not found');
    return this.okrRepository.deleteOkr(dto.okrId);
  }
}
