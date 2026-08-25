import { exchangeRepo, userRepo, transactionRepo, notificationRepo, listingRepo } from '../../data/repository';
import { DisputeRecord } from '../../data/store';
import { ResolveDisputeDto, BanUserDto } from './types';
import { NotFoundError } from '../../utils/errors';

export class AdminService {
  async getDisputes(status?: string): Promise<DisputeRecord[]> {
    return exchangeRepo.getDisputes(status);
  }

  async resolveDispute(disputeId: string, adminId: string, dto: ResolveDisputeDto): Promise<DisputeRecord> {
    const disputes = await exchangeRepo.getDisputes();
    const dispute = disputes.find((d) => d.id === disputeId);
    if (!dispute) throw new NotFoundError('Dispute not found');

    const updated = await exchangeRepo.updateDispute(disputeId, {
      status: dto.status,
      resolution_notes: dto.resolution_notes,
      resolved_at: new Date().toISOString(),
    });

    // If refund was ordered
    if (dto.refund_karma_to && dto.karma_amount && dto.karma_amount > 0) {
      await userRepo.updateKarma(dto.refund_karma_to, dto.karma_amount);
      await transactionRepo.create({
        id: `txn_${Date.now()}_refund`,
        from_user_id: null,
        to_user_id: dto.refund_karma_to,
        amount: dto.karma_amount,
        type: 'ADMIN_ADJUSTMENT',
        reference_id: disputeId,
        description: `Admin dispute resolution refund: ${dto.resolution_notes}`,
        created_at: new Date().toISOString(),
      });

      await notificationRepo.create({
        id: `notif_${Date.now()}`,
        user_id: dto.refund_karma_to,
        title: 'Dispute Resolved & Karma Refunded ⚖️',
        message: `Admin resolved dispute: ${dto.resolution_notes}. +${dto.karma_amount} Karma refunded.`,
        type: 'EXCHANGE_UPDATE',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    return updated!;
  }

  async banUser(userId: string, adminId: string, dto: BanUserDto): Promise<{ message: string }> {
    const user = await userRepo.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    await userRepo.update(userId, { is_verified: false });

    return {
      message: `User ${user.name} (${user.email}) has been suspended. Reason: ${dto.reason}`,
    };
  }

  async getFlaggedListings() {
    return listingRepo.getFlaggedListings();
  }
}

export const adminService = new AdminService();
