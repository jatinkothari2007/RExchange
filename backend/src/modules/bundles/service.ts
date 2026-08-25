import { bundleRepo, listingRepo, userRepo, exchangeRepo, notificationRepo } from '../../data/repository';
import { ListingBundle, Exchange } from '../../types';
import { BadRequestError, NotFoundError, ConflictError } from '../../utils/errors';

export interface CreateBundleDto {
  title: string;
  description: string;
  karma_value: number;
  listing_ids: string[];
}

export class BundleService {
  async createBundle(ownerId: string, dto: CreateBundleDto): Promise<ListingBundle> {
    if (!dto.title || !dto.description || !dto.karma_value) {
      throw new BadRequestError('Title, description, and karma_value are required for a bundle');
    }

    if (!dto.listing_ids || dto.listing_ids.length < 2) {
      throw new BadRequestError('A bundle must contain at least 2 listings');
    }

    // Verify all listings exist, belong to owner, and are available
    for (const lId of dto.listing_ids) {
      const listing = await listingRepo.findById(lId);
      if (!listing) {
        throw new NotFoundError(`Listing ${lId} not found`);
      }
      if (listing.owner_id !== ownerId) {
        throw new BadRequestError(`Listing ${listing.title} does not belong to you`);
      }
      if (listing.status !== 'available') {
        throw new ConflictError(`Listing ${listing.title} is not available (status: ${listing.status})`);
      }
    }

    const id = `bdl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const bundle: ListingBundle = {
      id,
      owner_id: ownerId,
      title: dto.title,
      description: dto.description,
      karma_value: Number(dto.karma_value),
      status: 'available',
      listing_ids: dto.listing_ids,
      created_at: new Date().toISOString(),
    };

    return bundleRepo.create(bundle);
  }

  async getAllBundles(status: string = 'available'): Promise<ListingBundle[]> {
    return bundleRepo.getAll(status);
  }

  async getBundleById(id: string): Promise<ListingBundle> {
    const bundle = await bundleRepo.findById(id);
    if (!bundle) throw new NotFoundError('Listing bundle not found');
    return bundle;
  }

  async requestBundleExchange(bundleId: string, receiverId: string, notes?: string): Promise<Exchange> {
    const bundle = await bundleRepo.findById(bundleId);
    if (!bundle) throw new NotFoundError('Listing bundle not found');

    if (bundle.status !== 'available') {
      throw new ConflictError(`Bundle is not available for exchange (status: ${bundle.status})`);
    }

    if (bundle.owner_id === receiverId) {
      throw new BadRequestError('You cannot request an exchange for your own bundle');
    }

    const receiver = await userRepo.findById(receiverId);
    if (!receiver) throw new NotFoundError('Receiver not found');

    if (receiver.karma_balance < bundle.karma_value) {
      throw new BadRequestError(
        `Insufficient karma balance (${receiver.karma_balance} available, ${bundle.karma_value} required for this bundle).`
      );
    }

    const id = `exc_bdl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const handoffCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const exchange: Exchange = {
      id,
      bundle_id: bundle.id,
      giver_id: bundle.owner_id,
      receiver_id: receiverId,
      agreed_karma: bundle.karma_value,
      status: 'REQUESTED',
      giver_confirmed: false,
      receiver_confirmed: false,
      handoff_code: handoffCode,
      notes: notes || `Bundle Trade: ${bundle.title}`,
      created_at: now,
      updated_at: now,
    };

    const created = await exchangeRepo.create(exchange);

    // Notify owner
    await notificationRepo.create({
      id: `notif_${Date.now()}`,
      user_id: bundle.owner_id,
      title: 'New Bundle Exchange Request 📦',
      message: `${receiver.name} requested bundle "${bundle.title}" for ${bundle.karma_value} Karma.`,
      type: 'EXCHANGE_UPDATE',
      link: `/exchanges/${created.id}`,
      is_read: false,
      created_at: now,
    });

    return created;
  }
}

export const bundleService = new BundleService();
