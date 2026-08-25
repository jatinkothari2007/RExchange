import {
  IUserRepository,
  IListingRepository,
  IBundleRepository,
  ILoanRepository,
  INeedRepository,
  IExchangeRepository,
  IMessageRepository,
  IReputationRepository,
  ITransactionRepository,
  INotificationRepository,
  IImpactRepository
} from './repository.interface';
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
import { dataStore, OtpRecord, DisputeRecord, FlaggedListingRecord } from './store';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
        if (!error && data) {
          const user = data as User;
          dataStore.users.set(user.id, user);
          return user;
        }
      } catch {}
    }
    return dataStore.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('users').select('*').ilike('email', email).single();
        if (!error && data) {
          const user = data as User;
          dataStore.users.set(user.id, user);
          return user;
        }
      } catch {}
    }
    for (const user of dataStore.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  async create(user: User): Promise<User> {
    dataStore.users.set(user.id, user);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('users').insert({
          id: user.id,
          name: user.name,
          email: user.email.toLowerCase(),
          department: user.department,
          year: user.year,
          hostel_block: user.hostel_block,
          karma_balance: user.karma_balance,
        });
      } catch {}
    }
    return user;
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    let existing = dataStore.users.get(id);
    if (!existing) {
      existing = (await this.findById(id)) || undefined;
    }
    if (!existing) return null;
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    dataStore.users.set(id, updated);

    if (isSupabaseConfigured) {
      try {
        const dbUpdates: Record<string, any> = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.department !== undefined) dbUpdates.department = updates.department;
        if (updates.year !== undefined) dbUpdates.year = updates.year;
        if (updates.hostel_block !== undefined) dbUpdates.hostel_block = updates.hostel_block;
        if (updates.karma_balance !== undefined) dbUpdates.karma_balance = updates.karma_balance;
        if (updates.reputation_score !== undefined) dbUpdates.reputation_score = updates.reputation_score;
        if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url;
        if (updates.will_recipient_id !== undefined) dbUpdates.will_recipient_id = updates.will_recipient_id;
        if (updates.will_activated !== undefined) dbUpdates.will_activated = updates.will_activated;
        dbUpdates.updated_at = new Date().toISOString();

        await supabase.from('users').update(dbUpdates).eq('id', id);
      } catch {}
    }
    return updated;
  }

  async getAll(): Promise<User[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('users').select('*');
        if (!error && data && data.length > 0) {
          for (const u of data) {
            dataStore.users.set(u.id, u as User);
          }
        }
      } catch {}
    }
    return Array.from(dataStore.users.values());
  }

  async updateKarma(id: string, delta: number): Promise<number> {
    let user = dataStore.users.get(id);
    if (!user && isSupabaseConfigured) {
      user = (await this.findById(id)) || undefined;
    }
    if (!user) throw new Error('User not found');
    user.karma_balance = (user.karma_balance || 0) + delta;
    dataStore.users.set(id, user);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('users').update({
          karma_balance: user.karma_balance,
          updated_at: new Date().toISOString(),
        }).eq('id', id);
      } catch {}
    }
    return user.karma_balance;
  }

  async saveOtp(record: OtpRecord): Promise<void> {
    dataStore.otps.set(record.email.toLowerCase(), record);
  }

  async getOtp(email: string): Promise<OtpRecord | null> {
    return dataStore.otps.get(email.toLowerCase()) || null;
  }

  async deleteOtp(email: string): Promise<void> {
    dataStore.otps.delete(email.toLowerCase());
  }
}

export class ListingRepository implements IListingRepository {
  async findById(id: string): Promise<Listing | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('listings').select('*').eq('id', id).single();
        if (!error && data) {
          const l = data as Listing;
          dataStore.listings.set(l.id, l);
          return l;
        }
      } catch {}
    }
    return dataStore.listings.get(id) || null;
  }

  async create(listing: Listing): Promise<Listing> {
    dataStore.listings.set(listing.id, listing);
    if (isSupabaseConfigured) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(listing.id);
        const payload: Record<string, any> = {
          owner_id: listing.owner_id,
          type: listing.type.toLowerCase(),
          title: listing.title,
          description: listing.description,
          category: listing.category,
          tags: listing.tags || [],
          karma_value: listing.karma_value,
          status: listing.status || 'available',
          pickup_point: listing.pickup_point,
          voice_note_url: (listing as any).voice_note_url || null,
          willed_from_name: listing.willed_from_name || null,
          expires_at: listing.expires_at || new Date(Date.now() + 30 * 86400000).toISOString(),
        };
        if (isUuid) {
          payload.id = listing.id;
        }

        const { data, error } = await supabase.from('listings').insert(payload).select().single();
        if (!error && data && data.id && !isUuid) {
          dataStore.listings.delete(listing.id);
          listing.id = data.id;
          dataStore.listings.set(listing.id, listing);
        }
      } catch {}
    }
    return listing;
  }

  async update(id: string, updates: Partial<Listing>): Promise<Listing | null> {
    let existing = dataStore.listings.get(id);
    if (!existing && isSupabaseConfigured) {
      existing = (await this.findById(id)) || undefined;
    }
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      last_activity_at: new Date().toISOString(),
    } as Listing;
    dataStore.listings.set(id, updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('listings').update({
          ...updates,
          updated_at: new Date().toISOString(),
        }).eq('id', id);
      } catch {}
    }
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('listings').delete().eq('id', id);
      } catch {}
    }
    return dataStore.listings.delete(id);
  }

  async getAll(): Promise<Listing[]> {
    return Array.from(dataStore.listings.values());
  }

  async find(filters: {
    type?: ListingType;
    category?: string;
    tag?: string;
    minKarma?: number;
    maxKarma?: number;
    ownerId?: string;
    status?: string;
    searchQuery?: string;
    hostelBlock?: string;
  }): Promise<Listing[]> {
    if (dataStore.listings.size === 0) {
      await this.getAll();
    }
    let results = Array.from(dataStore.listings.values());

    if (filters.status) {
      results = results.filter((l) => l.status === filters.status);
    } else {
      results = results.filter((l) => l.status === 'available');
    }

    if (filters.type) {
      results = results.filter((l) => l.type === filters.type);
    }

    if (filters.category) {
      results = results.filter((l) =>
        l.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }

    if (filters.tag) {
      results = results.filter((l) =>
        l.tags.some((t) => t.toLowerCase() === filters.tag!.toLowerCase())
      );
    }

    if (filters.minKarma !== undefined) {
      results = results.filter((l) => l.karma_value >= filters.minKarma!);
    }

    if (filters.maxKarma !== undefined) {
      results = results.filter((l) => l.karma_value <= filters.maxKarma!);
    }

    if (filters.ownerId) {
      results = results.filter((l) => l.owner_id === filters.ownerId);
    }

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      results = results.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    results.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return results;
  }

  async findByOwner(ownerId: string): Promise<Listing[]> {
    return this.find({ ownerId });
  }

  async flagListing(flag: FlaggedListingRecord): Promise<void> {
    dataStore.flaggedListings.set(flag.id, flag);
  }

  async getFlaggedListings(): Promise<FlaggedListingRecord[]> {
    return Array.from(dataStore.flaggedListings.values());
  }

  async resolveFlaggedListing(id: string): Promise<void> {
    dataStore.flaggedListings.delete(id);
  }
}

export class NeedRepository implements INeedRepository {
  async findById(id: string): Promise<UrgentNeed | null> {
    return dataStore.needs.get(id) || null;
  }

  async create(need: UrgentNeed): Promise<UrgentNeed> {
    dataStore.needs.set(need.id, need);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('needs').insert({
          id: need.id,
          requester_id: need.requester_id,
          title: need.title,
          description: need.description,
          category: need.category,
          tags: need.tags,
          deadline: need.target_deadline,
          urgency_score: need.urgency_score,
          status: need.status,
          hostel_block: need.hostel_block,
        });
      } catch {}
    }
    return need;
  }

  async update(id: string, updates: Partial<UrgentNeed>): Promise<UrgentNeed | null> {
    const existing = dataStore.needs.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    dataStore.needs.set(id, updated);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('needs').update(updates).eq('id', id);
      } catch {}
    }
    return updated;
  }

  async getAll(status?: string): Promise<UrgentNeed[]> {
    let list = Array.from(dataStore.needs.values());
    if (status) {
      list = list.filter((n) => n.status === status);
    }
    return list;
  }

  async findByRequester(requesterId: string): Promise<UrgentNeed[]> {
    return Array.from(dataStore.needs.values()).filter((n) => n.requester_id === requesterId);
  }
}

export class ExchangeRepository implements IExchangeRepository {
  async findById(id: string): Promise<Exchange | null> {
    if (isSupabaseConfigured) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isUuid) {
          const { data, error } = await supabase.from('exchanges').select('*').eq('id', id).single();
          if (!error && data) {
            const ex = {
              id: data.id,
              listing_id: data.listing_id,
              giver_id: data.giver_id,
              receiver_id: data.receiver_id,
              agreed_karma: data.karma_value || 0,
              status: (data.status || 'requested').toUpperCase() as any,
              giver_confirmed: Boolean(data.handoff_confirmed_giver),
              receiver_confirmed: Boolean(data.handoff_confirmed_receiver),
              handoff_code: data.handoff_code,
              notes: data.notes,
              created_at: data.created_at,
              updated_at: data.created_at,
            } as Exchange;
            dataStore.exchanges.set(ex.id, ex);
            return ex;
          }
        }
      } catch {}
    }
    return dataStore.exchanges.get(id) || null;
  }

  async create(exchange: Exchange): Promise<Exchange> {
    dataStore.exchanges.set(exchange.id, exchange);
    if (isSupabaseConfigured) {
      try {
        const isUuid = (str?: string) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        const payload: Record<string, any> = {
          giver_id: exchange.giver_id,
          receiver_id: exchange.receiver_id,
          karma_value: exchange.agreed_karma,
          status: (exchange.status || 'requested').toLowerCase(),
          handoff_code: exchange.handoff_code || null,
          notes: exchange.notes || null,
        };
        if (isUuid(exchange.id)) payload.id = exchange.id;
        if (isUuid(exchange.listing_id)) payload.listing_id = exchange.listing_id;
        if (isUuid((exchange as any).need_id)) payload.need_id = (exchange as any).need_id;
        if (exchange.bundle_id && isUuid(exchange.bundle_id)) payload.bundle_id = exchange.bundle_id;

        const { data, error } = await supabase.from('exchanges').insert(payload).select().single();
        if (!error && data && data.id && !isUuid(exchange.id)) {
          dataStore.exchanges.delete(exchange.id);
          exchange.id = data.id;
          dataStore.exchanges.set(exchange.id, exchange);
        }
      } catch {}
    }
    return exchange;
  }

  async update(id: string, updates: Partial<Exchange>): Promise<Exchange | null> {
    let existing = dataStore.exchanges.get(id);
    if (!existing && isSupabaseConfigured) {
      existing = (await this.findById(id)) || undefined;
    }
    if (!existing) return null;
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    dataStore.exchanges.set(id, updated);
    if (isSupabaseConfigured) {
      try {
        const dbUpdates: Record<string, any> = {};
        if (updates.status) dbUpdates.status = (updates.status as string).toLowerCase();
        if (updates.handoff_code !== undefined) dbUpdates.handoff_code = updates.handoff_code;
        if (updates.giver_confirmed !== undefined) dbUpdates.handoff_confirmed_giver = updates.giver_confirmed;
        if (updates.receiver_confirmed !== undefined) dbUpdates.handoff_confirmed_receiver = updates.receiver_confirmed;
        if (updates.agreed_karma !== undefined) dbUpdates.karma_value = updates.agreed_karma;
        if ((updates.status as string) === 'COMPLETED' || (updates.status as string) === 'completed') dbUpdates.completed_at = new Date().toISOString();

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isUuid) {
          await supabase.from('exchanges').update(dbUpdates).eq('id', id);
        }
      } catch {}
    }
    return updated;
  }

  async findByUser(userId: string): Promise<Exchange[]> {
    return Array.from(dataStore.exchanges.values())
      .filter((e) => e.giver_id === userId || e.receiver_id === userId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  async findByListing(listingId: string): Promise<Exchange[]> {
    return Array.from(dataStore.exchanges.values()).filter((e) => e.listing_id === listingId);
  }

  async createDispute(dispute: DisputeRecord): Promise<DisputeRecord> {
    dataStore.disputes.set(dispute.id, dispute);
    return dispute;
  }

  async getDisputes(status?: string): Promise<DisputeRecord[]> {
    let list = Array.from(dataStore.disputes.values());
    if (status) {
      list = list.filter((d) => d.status === status);
    }
    return list;
  }

  async updateDispute(id: string, updates: Partial<DisputeRecord>): Promise<DisputeRecord | null> {
    const existing = dataStore.disputes.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    dataStore.disputes.set(id, updated);
    return updated;
  }
}

export class MessageRepository implements IMessageRepository {
  async findByExchange(exchangeId: string): Promise<Message[]> {
    return dataStore.messages.get(exchangeId) || [];
  }

  async create(message: Message): Promise<Message> {
    const list = dataStore.messages.get(message.exchange_id) || [];
    list.push(message);
    dataStore.messages.set(message.exchange_id, list);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('messages').insert({
          id: message.id,
          exchange_id: message.exchange_id,
          sender_id: message.sender_id,
          body: message.content,
          message_type: message.type,
          proposed_karma: message.proposed_karma,
        });
      } catch {}
    }
    return message;
  }

  async update(id: string, exchangeId: string, updates: Partial<Message>): Promise<Message | null> {
    const list = dataStore.messages.get(exchangeId) || [];
    const idx = list.findIndex((m) => m.id === id);
    if (idx !== -1) {
      const updated = { ...list[idx], ...updates };
      list[idx] = updated;
      dataStore.messages.set(exchangeId, list);
      return updated;
    }
    return null;
  }
}

export class ReputationRepository implements IReputationRepository {
  async createRating(rating: ReputationRating): Promise<ReputationRating> {
    dataStore.ratings.set(rating.id, rating);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('ratings').insert({
          id: rating.id,
          exchange_id: rating.exchange_id,
          rater_id: rating.reviewer_id,
          ratee_id: rating.target_user_id,
          score: rating.rating,
          tags: rating.feedback_tags,
          comment: rating.comment,
        });
      } catch {}
    }
    return rating;
  }

  async findByTargetUser(userId: string): Promise<ReputationRating[]> {
    return Array.from(dataStore.ratings.values()).filter((r) => r.target_user_id === userId);
  }

  async findByExchange(exchangeId: string): Promise<ReputationRating[]> {
    return Array.from(dataStore.ratings.values()).filter((r) => r.exchange_id === exchangeId);
  }
}

export class TransactionRepository implements ITransactionRepository {
  async create(transaction: KarmaTransaction): Promise<KarmaTransaction> {
    dataStore.transactions.set(transaction.id, transaction);
    if (isSupabaseConfigured && transaction.to_user_id) {
      try {
        await supabase.from('karma_transactions').insert({
          id: transaction.id,
          user_id: transaction.to_user_id,
          exchange_id: transaction.reference_id,
          amount: transaction.amount,
          direction: transaction.amount >= 0 ? 'credit' : 'debit',
          balance_after: 50,
          description: transaction.description,
        });
      } catch {}
    }
    return transaction;
  }

  async findByUser(userId: string): Promise<KarmaTransaction[]> {
    return Array.from(dataStore.transactions.values())
      .filter((t) => t.from_user_id === userId || t.to_user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getAll(): Promise<KarmaTransaction[]> {
    return Array.from(dataStore.transactions.values());
  }
}

export class NotificationRepository implements INotificationRepository {
  async create(notification: Notification): Promise<Notification> {
    const list = dataStore.notifications.get(notification.user_id) || [];
    list.unshift(notification);
    dataStore.notifications.set(notification.user_id, list);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('notifications').insert({
          id: notification.id,
          user_id: notification.user_id,
          type: notification.type,
          payload: {
            title: notification.title,
            message: notification.message,
            link: notification.link,
          },
          read: notification.is_read,
        });
      } catch {}
    }
    return notification;
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return dataStore.notifications.get(userId) || [];
  }

  async markAsRead(id: string, userId: string): Promise<boolean> {
    const list = dataStore.notifications.get(userId) || [];
    const idx = list.findIndex((n) => n.id === id);
    if (idx !== -1) {
      list[idx].is_read = true;
      dataStore.notifications.set(userId, list);

      if (isSupabaseConfigured) {
        try {
          await supabase.from('notifications').update({ read: true }).eq('id', id);
        } catch {}
      }
      return true;
    }
    return false;
  }

  async markAllAsRead(userId: string): Promise<void> {
    const list = dataStore.notifications.get(userId) || [];
    list.forEach((n) => (n.is_read = true));
    dataStore.notifications.set(userId, list);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
      } catch {}
    }
  }
}

export class ImpactRepository implements IImpactRepository {
  async getPersonalImpact(userId: string): Promise<ImpactStats> {
    const userExchanges = Array.from(dataStore.exchanges.values()).filter(
      (e) => (e.giver_id === userId || e.receiver_id === userId) && e.status === 'COMPLETED'
    );

    let moneySaved = 0;
    let wasteDiverted = 0;
    let tutoringHours = 0;
    let karmaCirculated = 0;

    for (const exc of userExchanges) {
      karmaCirculated += exc.agreed_karma;
      const listing = exc.listing_id ? dataStore.listings.get(exc.listing_id) : undefined;

      if (listing) {
        if (listing.type === 'ITEM') {
          moneySaved += listing.original_price_est || 600;
          wasteDiverted += 1.2;
        } else if (listing.type === 'NOTE') {
          moneySaved += 350;
          wasteDiverted += 0.5;
        } else if (listing.type === 'TICKET') {
          moneySaved += 400;
        } else if (listing.type === 'SKILL') {
          tutoringHours += (listing.duration_minutes || 60) / 60;
          moneySaved += 500;
        } else if (listing.type === 'OPPORTUNITY') {
          moneySaved += 250;
        }
      } else if (exc.bundle_id) {
        moneySaved += 1200;
        wasteDiverted += 2.4;
      }
    }

    return {
      money_saved_inr: moneySaved,
      waste_diverted_kg: Math.round(wasteDiverted * 10) / 10,
      tutoring_hours: Math.round(tutoringHours * 10) / 10,
      exchanges_count: userExchanges.length,
      karma_circulated: karmaCirculated,
    };
  }

  async getCampusImpact(): Promise<ImpactStats> {
    const allCompleted = Array.from(dataStore.exchanges.values()).filter(
      (e) => e.status === 'COMPLETED'
    );

    let moneySaved = 48750;
    let wasteDiverted = 114.5;
    let tutoringHours = 96.0;
    let karmaCirculated = 3420;

    for (const exc of allCompleted) {
      karmaCirculated += exc.agreed_karma;
      const listing = exc.listing_id ? dataStore.listings.get(exc.listing_id) : undefined;
      if (listing) {
        if (listing.type === 'ITEM') {
          moneySaved += listing.original_price_est || 600;
          wasteDiverted += 1.2;
        } else if (listing.type === 'NOTE') {
          moneySaved += 350;
          wasteDiverted += 0.5;
        } else if (listing.type === 'TICKET') {
          moneySaved += 400;
        } else if (listing.type === 'SKILL') {
          tutoringHours += (listing.duration_minutes || 60) / 60;
          moneySaved += 500;
        } else if (listing.type === 'OPPORTUNITY') {
          moneySaved += 250;
        }
      } else if (exc.bundle_id) {
        moneySaved += 1200;
        wasteDiverted += 2.4;
      }
    }

    return {
      money_saved_inr: moneySaved,
      waste_diverted_kg: Math.round(wasteDiverted * 10) / 10,
      tutoring_hours: Math.round(tutoringHours * 10) / 10,
      exchanges_count: 78 + allCompleted.length,
      karma_circulated: karmaCirculated,
    };
  }
}

export class BundleRepository implements IBundleRepository {
  async findById(id: string): Promise<ListingBundle | null> {
    const bundle = dataStore.bundles.get(id);
    if (!bundle) return null;
    const items = bundle.listing_ids
      .map((lId) => dataStore.listings.get(lId))
      .filter((l): l is Listing => Boolean(l));
    const owner = dataStore.users.get(bundle.owner_id);
    return { ...bundle, items, owner };
  }

  async create(bundle: ListingBundle): Promise<ListingBundle> {
    dataStore.bundles.set(bundle.id, bundle);
    return bundle;
  }

  async update(id: string, updates: Partial<ListingBundle>): Promise<ListingBundle | null> {
    const existing = dataStore.bundles.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    dataStore.bundles.set(id, updated);
    return updated;
  }

  async getAll(status?: string): Promise<ListingBundle[]> {
    const list = Array.from(dataStore.bundles.values());
    const filtered = status ? list.filter((b) => b.status === status) : list;
    return filtered.map((bundle) => {
      const items = bundle.listing_ids
        .map((lId) => dataStore.listings.get(lId))
        .filter((l): l is Listing => Boolean(l));
      const owner = dataStore.users.get(bundle.owner_id);
      return { ...bundle, items, owner };
    });
  }

  async findByOwner(ownerId: string): Promise<ListingBundle[]> {
    return (await this.getAll()).filter((b) => b.owner_id === ownerId);
  }
}

export class LoanRepository implements ILoanRepository {
  async findById(id: string): Promise<KarmaLoan | null> {
    return dataStore.loans.get(id) || null;
  }

  async create(loan: KarmaLoan): Promise<KarmaLoan> {
    dataStore.loans.set(loan.id, loan);
    return loan;
  }

  async update(id: string, updates: Partial<KarmaLoan>): Promise<KarmaLoan | null> {
    const existing = dataStore.loans.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    dataStore.loans.set(id, updated);
    return updated;
  }

  async findByUser(userId: string): Promise<KarmaLoan[]> {
    return Array.from(dataStore.loans.values())
      .filter((l) => l.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getActiveLoanByUser(userId: string): Promise<KarmaLoan | null> {
    for (const loan of dataStore.loans.values()) {
      if (loan.user_id === userId && loan.status === 'active') {
        return loan;
      }
    }
    return null;
  }
}

// Single instantiated repository registry for services
export const userRepo = new UserRepository();
export const listingRepo = new ListingRepository();
export const bundleRepo = new BundleRepository();
export const loanRepo = new LoanRepository();
export const needRepo = new NeedRepository();
export const exchangeRepo = new ExchangeRepository();
export const messageRepo = new MessageRepository();
export const reputationRepo = new ReputationRepository();
export const transactionRepo = new TransactionRepository();
export const notificationRepo = new NotificationRepository();
export const impactRepo = new ImpactRepository();
