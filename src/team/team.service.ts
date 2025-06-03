import { Injectable } from '@nestjs/common';
import { TeamRepository } from './team.repository';

@Injectable()
export class TeamService {
  constructor(private readonly teamRepository: TeamRepository) {}

  async getTeamMembers(userId: number) {
    // Here you can add more business logic if required
    return this.teamRepository.findTeamMembers(userId);
  }
}
