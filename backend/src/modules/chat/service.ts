import { messageRepo, exchangeRepo, userRepo, notificationRepo } from '../../data/repository';
import { Message } from '../../types';
import { SendMessageDto, RespondProposalDto } from './types';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors';

export class ChatService {
  async getMessages(exchangeId: string, userId: string): Promise<Message[]> {
    const exchange = await exchangeRepo.findById(exchangeId);
    if (!exchange) throw new NotFoundError('Exchange not found');

    if (exchange.giver_id !== userId && exchange.receiver_id !== userId) {
      throw new ForbiddenError('You are not authorized to view messages in this exchange');
    }

    return messageRepo.findByExchange(exchangeId);
  }

  async sendMessage(exchangeId: string, senderId: string, dto: SendMessageDto): Promise<Message> {
    const exchange = await exchangeRepo.findById(exchangeId);
    if (!exchange) throw new NotFoundError('Exchange not found');

    if (exchange.giver_id !== senderId && exchange.receiver_id !== senderId) {
      throw new ForbiddenError('You are not a participant in this exchange');
    }

    if (exchange.status === 'COMPLETED' || exchange.status === 'CANCELLED') {
      throw new BadRequestError(`Cannot send messages in a ${exchange.status} exchange`);
    }

    if (dto.type === 'propose_karma') {
      if (!dto.proposed_karma || dto.proposed_karma < 5) {
        throw new BadRequestError('A valid proposed karma value (min 5) is required');
      }
    }

    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      exchange_id: exchangeId,
      sender_id: senderId,
      type: dto.type || 'text',
      content: dto.content,
      proposed_karma: dto.proposed_karma,
      proposal_status: dto.type === 'propose_karma' ? 'pending' : undefined,
      created_at: new Date().toISOString(),
    };

    const created = await messageRepo.create(message);

    // Notify other peer
    const otherUserId = exchange.giver_id === senderId ? exchange.receiver_id : exchange.giver_id;
    const sender = await userRepo.findById(senderId);

    await notificationRepo.create({
      id: `notif_${Date.now()}`,
      user_id: otherUserId,
      title: dto.type === 'propose_karma' ? 'Karma Proposal Received 💬' : 'New Exchange Message 💬',
      message: dto.type === 'propose_karma'
        ? `${sender?.name || 'Peer'} proposed ${dto.proposed_karma} Karma for this exchange.`
        : `${sender?.name || 'Peer'}: "${dto.content.substring(0, 60)}"`,
      type: 'EXCHANGE_UPDATE',
      link: `/exchanges/${exchangeId}`,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    return created;
  }

  async respondToProposal(
    exchangeId: string,
    messageId: string,
    userId: string,
    dto: RespondProposalDto
  ): Promise<{ message: Message; updatedAgreedKarma?: number }> {
    const exchange = await exchangeRepo.findById(exchangeId);
    if (!exchange) throw new NotFoundError('Exchange not found');

    if (exchange.giver_id !== userId && exchange.receiver_id !== userId) {
      throw new ForbiddenError('You are not authorized in this exchange');
    }

    const messages = await messageRepo.findByExchange(exchangeId);
    const targetMsg = messages.find((m) => m.id === messageId);
    if (!targetMsg) throw new NotFoundError('Proposal message not found');

    if (targetMsg.type !== 'propose_karma' || !targetMsg.proposed_karma) {
      throw new BadRequestError('This message is not a karma proposal');
    }

    if (targetMsg.sender_id === userId) {
      throw new BadRequestError('You cannot respond to your own proposal');
    }

    if (targetMsg.proposal_status !== 'pending') {
      throw new BadRequestError(`This proposal is already ${targetMsg.proposal_status}`);
    }

    const newStatus = dto.action === 'accept' ? 'accepted' : 'rejected';
    const updatedMsg = await messageRepo.update(messageId, exchangeId, {
      proposal_status: newStatus,
    });

    if (dto.action === 'accept') {
      // Update agreed karma on exchange
      await exchangeRepo.update(exchangeId, {
        agreed_karma: targetMsg.proposed_karma,
      });

      return {
        message: updatedMsg!,
        updatedAgreedKarma: targetMsg.proposed_karma,
      };
    }

    return {
      message: updatedMsg!,
    };
  }
}

export const chatService = new ChatService();
