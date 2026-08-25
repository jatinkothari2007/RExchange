import {
  User,
  Listing,
  ListingBundle,
  UrgentNeed,
  Exchange,
  Message,
  ReputationRating,
  KarmaTransaction,
  KarmaLoan,
  Notification,
  ImpactStats,
  ListingType
} from '../types';
import { OtpRecord, DisputeRecord, FlaggedListingRecord } from './store';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(id: string, updates: Partial<User>): Promise<User | null>;
  getAll(): Promise<User[]>;
  updateKarma(id: string, delta: number): Promise<number>;
  saveOtp(record: OtpRecord): Promise<void>;
  getOtp(email: string): Promise<OtpRecord | null>;
  deleteOtp(email: string): Promise<void>;
}

export interface IListingRepository {
  findById(id: string): Promise<Listing | null>;
  create(listing: Listing): Promise<Listing>;
  update(id: string, updates: Partial<Listing>): Promise<Listing | null>;
  delete(id: string): Promise<boolean>;
  find(filters: {
    type?: ListingType;
    category?: string;
    tag?: string;
    minKarma?: number;
    maxKarma?: number;
    ownerId?: string;
    status?: string;
    searchQuery?: string;
    hostelBlock?: string;
  }): Promise<Listing[]>;
  getAll(): Promise<Listing[]>;
  flagListing(record: FlaggedListingRecord): Promise<void>;
  getFlaggedListings(): Promise<FlaggedListingRecord[]>;
}

export interface INeedRepository {
  findById(id: string): Promise<UrgentNeed | null>;
  create(need: UrgentNeed): Promise<UrgentNeed>;
  update(id: string, updates: Partial<UrgentNeed>): Promise<UrgentNeed | null>;
  getAll(status?: string): Promise<UrgentNeed[]>;
  findByRequester(requesterId: string): Promise<UrgentNeed[]>;
}

export interface IExchangeRepository {
  findById(id: string): Promise<Exchange | null>;
  create(exchange: Exchange): Promise<Exchange>;
  update(id: string, updates: Partial<Exchange>): Promise<Exchange | null>;
  findByUser(userId: string): Promise<Exchange[]>;
  findByListing(listingId: string): Promise<Exchange[]>;
  createDispute(dispute: DisputeRecord): Promise<DisputeRecord>;
  getDisputes(status?: string): Promise<DisputeRecord[]>;
  updateDispute(id: string, updates: Partial<DisputeRecord>): Promise<DisputeRecord | null>;
}

export interface IMessageRepository {
  findByExchange(exchangeId: string): Promise<Message[]>;
  create(message: Message): Promise<Message>;
  update(id: string, exchangeId: string, updates: Partial<Message>): Promise<Message | null>;
}

export interface IReputationRepository {
  createRating(rating: ReputationRating): Promise<ReputationRating>;
  findByTargetUser(userId: string): Promise<ReputationRating[]>;
  findByExchange(exchangeId: string): Promise<ReputationRating[]>;
}

export interface ITransactionRepository {
  create(txn: KarmaTransaction): Promise<KarmaTransaction>;
  findByUser(userId: string): Promise<KarmaTransaction[]>;
  getAll(): Promise<KarmaTransaction[]>;
}

export interface INotificationRepository {
  findByUser(userId: string): Promise<Notification[]>;
  create(notification: Notification): Promise<Notification>;
  markAsRead(id: string, userId: string): Promise<boolean>;
  markAllAsRead(userId: string): Promise<void>;
}

export interface IImpactRepository {
  getPersonalImpact(userId: string): Promise<ImpactStats>;
  getCampusImpact(): Promise<ImpactStats>;
}

export interface IBundleRepository {
  findById(id: string): Promise<ListingBundle | null>;
  create(bundle: ListingBundle): Promise<ListingBundle>;
  update(id: string, updates: Partial<ListingBundle>): Promise<ListingBundle | null>;
  getAll(status?: string): Promise<ListingBundle[]>;
  findByOwner(ownerId: string): Promise<ListingBundle[]>;
}

export interface ILoanRepository {
  findById(id: string): Promise<KarmaLoan | null>;
  create(loan: KarmaLoan): Promise<KarmaLoan>;
  update(id: string, updates: Partial<KarmaLoan>): Promise<KarmaLoan | null>;
  findByUser(userId: string): Promise<KarmaLoan[]>;
  getActiveLoanByUser(userId: string): Promise<KarmaLoan | null>;
}
