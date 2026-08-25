import { listingRepo, userRepo } from '../../data/repository';
import { Listing, ItemListing, NoteListing, TicketListing, SkillListing, OpportunityListing } from '../../types';
import { CreateListingDto, UpdateListingDto, ListingFilterQuery } from './types';
import { calculateSuggestedKarma } from './heuristics';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors';

export class ListingService {
  async createListing(ownerId: string, dto: CreateListingDto): Promise<Listing> {
    const owner = await userRepo.findById(ownerId);
    if (!owner) throw new NotFoundError('Owner user not found');

    const suggestion = calculateSuggestedKarma({
      type: dto.type,
      category: dto.category,
      condition: dto.condition,
      original_price_est: dto.original_price_est,
      duration_minutes: dto.duration_minutes,
      page_count: dto.page_count,
      tags: dto.tags,
    });

    let finalKarma = dto.karma_value ?? suggestion.suggestedKarma;
    // Enforce bounding cap
    if (finalKarma < suggestion.minAllowedKarma || finalKarma > suggestion.maxAllowedKarma) {
      throw new BadRequestError(
        `Karma value must be between ${suggestion.minAllowedKarma} and ${suggestion.maxAllowedKarma} for this category (System suggested: ${suggestion.suggestedKarma}).`
      );
    }

    const expiresInDays = dto.expires_in_days || 30;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInDays * 86400000).toISOString();
    const id = `lst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const baseListing = {
      id,
      owner_id: ownerId,
      type: dto.type,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      tags: dto.tags.map((t) => t.toLowerCase().trim()),
      karma_value: finalKarma,
      status: 'available' as const,
      pickup_point: dto.pickup_point,
      image_url: dto.image_url,
      created_at: now.toISOString(),
      expires_at: expiresAt,
      last_activity_at: now.toISOString(),
    };

    let fullListing: Listing;

    switch (dto.type) {
      case 'ITEM':
        fullListing = {
          ...baseListing,
          type: 'ITEM',
          condition: dto.condition || 'good',
          original_price_est: dto.original_price_est,
        } as ItemListing;
        break;
      case 'NOTE':
        fullListing = {
          ...baseListing,
          type: 'NOTE',
          subject: dto.subject || 'General Study',
          semester: dto.semester || 1,
          file_url: dto.file_url,
          page_count: dto.page_count,
        } as NoteListing;
        break;
      case 'TICKET':
        fullListing = {
          ...baseListing,
          type: 'TICKET',
          event_name: dto.event_name || dto.title,
          event_date: dto.event_date || expiresAt,
          venue: dto.venue || dto.pickup_point,
        } as TicketListing;
        break;
      case 'SKILL':
        fullListing = {
          ...baseListing,
          type: 'SKILL',
          skill_category: dto.skill_category || dto.category,
          duration_minutes: dto.duration_minutes || 60,
          session_mode: dto.session_mode || 'in_person',
        } as SkillListing;
        break;
      case 'OPPORTUNITY':
        fullListing = {
          ...baseListing,
          type: 'OPPORTUNITY',
          organization: dto.organization || 'SRM Student Chapter',
          role_title: dto.role_title || dto.title,
          application_deadline: dto.application_deadline,
        } as OpportunityListing;
        break;
    }

    return listingRepo.create(fullListing);
  }

  async getListings(filters: ListingFilterQuery): Promise<Listing[]> {
    return listingRepo.find({
      type: filters.type,
      category: filters.category,
      tag: filters.tag,
      minKarma: filters.minKarma,
      maxKarma: filters.maxKarma,
      ownerId: filters.ownerId,
      status: filters.status,
      searchQuery: filters.q,
      hostelBlock: filters.hostelBlock,
    });
  }

  async getListingById(id: string): Promise<Listing & { owner?: any }> {
    const listing = await listingRepo.findById(id);
    if (!listing) throw new NotFoundError('Listing not found');

    const owner = await userRepo.findById(listing.owner_id);
    return {
      ...listing,
      owner: owner
        ? {
            id: owner.id,
            name: owner.name,
            department: owner.department,
            year: owner.year,
            hostel_block: owner.hostel_block,
            avatar_url: owner.avatar_url,
          }
        : undefined,
    };
  }

  async updateListing(id: string, userId: string, dto: UpdateListingDto): Promise<Listing> {
    const existing = await listingRepo.findById(id);
    if (!existing) throw new NotFoundError('Listing not found');
    if (existing.owner_id !== userId) {
      throw new ForbiddenError('Only the listing owner can modify this listing');
    }

    const updated = await listingRepo.update(id, dto);
    return updated!;
  }

  async deleteListing(id: string, userId: string): Promise<void> {
    const existing = await listingRepo.findById(id);
    if (!existing) throw new NotFoundError('Listing not found');
    if (existing.owner_id !== userId) {
      throw new ForbiddenError('Only the listing owner can delete this listing');
    }

    await listingRepo.delete(id);
  }

  async uploadVoiceNote(id: string, userId: string, voiceNoteUrl: string): Promise<Listing> {
    const existing = await listingRepo.findById(id);
    if (!existing) throw new NotFoundError('Listing not found');
    if (existing.owner_id !== userId) {
      throw new ForbiddenError('Only the listing owner can upload a voice note');
    }
    if (existing.type !== 'SKILL') {
      throw new BadRequestError('Voice notes can only be attached to SKILL-type listings');
    }

    const updated = await listingRepo.update(id, { voice_note_url: voiceNoteUrl } as any);
    return updated!;
  }

  async flagListing(listingId: string, flaggedBy: string, reason: string): Promise<void> {
    const listing = await listingRepo.findById(listingId);
    if (!listing) throw new NotFoundError('Listing not found');

    await listingRepo.flagListing({
      id: `flg_${Date.now()}`,
      listing_id: listingId,
      flagged_by: flaggedBy,
      reason,
      created_at: new Date().toISOString(),
    });
  }
}

export const listingService = new ListingService();

