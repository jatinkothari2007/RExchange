import { MessageType } from '../../types';

export interface SendMessageDto {
  type?: MessageType;
  content: string;
  proposed_karma?: number;
}

export interface RespondProposalDto {
  action: 'accept' | 'reject';
}
