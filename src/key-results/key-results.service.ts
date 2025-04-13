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
    const userRole = user.role.toUpperCase();
    const okr = await this.keyResultsRepository.findOKR(dto.okrId, userId);

    if (!okr) {
      throw new NotFoundException('OKR not found');
    }

    console.log('okr user_id', okr.user_id);
    const isOwner = okr.user_id === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You are not authorized to add a key result to this OKR',
      );
    }
    return this.keyResultsRepository.create(dto, userId);
  }

  async getAllByOkr(okrId: number) {
    return this.keyResultsRepository.findAllByOkr(okrId);
  }

  async update(id: number, dto: UpdateKeyResultDto, userId: number) {
    return this.keyResultsRepository.update(id, dto, userId);
  }
}
