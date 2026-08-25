import { impactRepo } from '../../data/repository';
import { ImpactStats } from '../../types';

export class ImpactService {
  async getPersonalImpact(userId: string): Promise<ImpactStats> {
    return impactRepo.getPersonalImpact(userId);
  }

  async getCampusImpact(): Promise<ImpactStats> {
    return impactRepo.getCampusImpact();
  }
}

export const impactService = new ImpactService();
