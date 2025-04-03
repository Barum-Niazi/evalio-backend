import { Injectable, NotFoundException } from '@nestjs/common';
import { KeyResultsRepository } from './key-results.repository';
import {
  CreateKeyResultDto,
  UpdateKeyResultDto,
  GetKeyResultDto,
  DeleteKeyResultDto,
} from './dto/key-results.dto';

@Injectable()
export class KeyResultsService {
  constructor(private readonly repo: KeyResultsRepository) {}

  async create(dto: CreateKeyResultDto) {
    return this.repo.create(dto);
  }

  async getOne(dto: GetKeyResultDto) {
    const kr = await this.repo.findById(dto.id);
    if (!kr) throw new NotFoundException('Key Result not found');
    return kr;
  }

  async getAllByOkr(okrId: number) {
    return this.repo.findAllByOkr(okrId);
  }

  async update(dto: UpdateKeyResultDto) {
    const kr = await this.repo.findById(dto.id);
    if (!kr) throw new NotFoundException('Key Result not found');
    return this.repo.update(dto);
  }

  async delete(dto: DeleteKeyResultDto) {
    const kr = await this.repo.findById(dto.id);
    if (!kr) throw new NotFoundException('Key Result not found');
    return this.repo.delete(dto.id);
  }
}
