import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { KeyResultsRepository } from './key-results.repository';
import { CreateKeyResultDto, UpdateKeyResultDto } from './dto/key-results.dto';

@Injectable()
export class KeyResultsService {
  constructor(private readonly keyResultsRepository: KeyResultsRepository) {}

  async create(dto: CreateKeyResultDto, user) {
    const userId = user.id;
    const isAdmin = Array.isArray(user.roles) && user.roles.includes('ADMIN');

    const okr = await this.keyResultsRepository.findOKR(dto.okrId, userId);
    if (!okr) {
      throw new NotFoundException('OKR not found');
    }

    const isOwner = okr.user_id === userId;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You are not authorized to add a key result to this OKR',
      );
    }

    return this.keyResultsRepository.create(dto, userId);
  }

  async createMany(dtos: CreateKeyResultDto[], user) {
    const userId = user.id;
    const isAdmin = Array.isArray(user.roles) && user.roles.includes('ADMIN');
    const results = [];

    for (const dto of dtos) {
      const okr = await this.keyResultsRepository.findOKR(dto.okrId, userId);

      if (!okr) throw new NotFoundException(`OKR ${dto.okrId} not found`);

      const isOwner = okr.user_id === userId;
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException(
          `You are not authorized to add a key result to OKR ${dto.okrId}`,
        );
      }

      const kr = await this.keyResultsRepository.create(dto, userId);
      results.push(kr);
    }

    // Batched update of parent progress
    const parentIds = new Set(
      dtos.map((d) => d.parentKeyResultId).filter(Boolean),
    );
    for (const parentId of parentIds) {
      await this.keyResultsRepository.updateParentProgress(parentId);
    }

    return results;
  }

  async getAllByOkr(okrId: number) {
    return this.keyResultsRepository.findAllByOkr(okrId);
  }
  async update(
    id: number,
    dto: UpdateKeyResultDto,
    user: { id: number; roles: string[] },
  ) {
    const kr = await this.keyResultsRepository.findByIdWithOkr(id);
    if (!kr) throw new NotFoundException('Key result not found');

    const isAdmin = Array.isArray(user.roles) && user.roles.includes('ADMIN');

    const isAssigned = kr.okr.assigned_to.some(
      (userOkr) => userOkr.user_id === user.id,
    );

    if (!isAssigned && !isAdmin) {
      throw new ForbiddenException(
        'You are not authorized to update this Key Result',
      );
    }

    return this.keyResultsRepository.update(id, dto, user.id);
  }
}
