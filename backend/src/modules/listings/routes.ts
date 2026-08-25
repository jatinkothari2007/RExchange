import { Router } from 'express';
import { listingService } from './service';
import { validate } from '../../middleware/validate';
import {
  createListingSchema,
  updateListingSchema,
  suggestKarmaSchema,
} from './validation';
import { authenticate, optionalAuth, AuthenticatedRequest } from '../../middleware/auth';
import { listingRateLimiter } from '../../middleware/rateLimiter';
import { calculateSuggestedKarma } from './heuristics';

export const listingRouter = Router();

// Auto-suggest karma pure heuristic endpoint (great for instant UI updates & demo explaining)
listingRouter.post('/suggest-karma', validate(suggestKarmaSchema), (req, res) => {
  const result = calculateSuggestedKarma(req.body);
  return res.status(200).json({ success: true, data: result });
});

// Search & Filter Listings
listingRouter.get('/search', optionalAuth, async (req, res, next) => {
  try {
    const filters = {
      type: req.query.type as any,
      category: req.query.category as string,
      tag: req.query.tag as string,
      minKarma: req.query.minKarma ? parseInt(req.query.minKarma as string, 10) : undefined,
      maxKarma: req.query.maxKarma ? parseInt(req.query.maxKarma as string, 10) : undefined,
      status: req.query.status as string,
      q: req.query.q as string,
      hostelBlock: req.query.hostelBlock as string,
    };
    const listings = await listingService.getListings(filters);
    return res.status(200).json({ success: true, count: listings.length, data: listings });
  } catch (err) {
    return next(err);
  }
});

// List all listings (with filters)
listingRouter.get('/', optionalAuth, async (req, res, next) => {
  try {
    const filters = {
      type: req.query.type as any,
      category: req.query.category as string,
      tag: req.query.tag as string,
      minKarma: req.query.minKarma ? parseInt(req.query.minKarma as string, 10) : undefined,
      maxKarma: req.query.maxKarma ? parseInt(req.query.maxKarma as string, 10) : undefined,
      ownerId: req.query.ownerId as string,
      status: req.query.status as string,
      hostelBlock: req.query.hostelBlock as string,
    };
    const listings = await listingService.getListings(filters);
    return res.status(200).json({ success: true, count: listings.length, data: listings });
  } catch (err) {
    return next(err);
  }
});

// Get single listing
listingRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const listing = await listingService.getListingById(req.params.id);
    return res.status(200).json({ success: true, data: listing });
  } catch (err) {
    return next(err);
  }
});

// Create new listing
listingRouter.post(
  '/',
  authenticate,
  listingRateLimiter,
  validate(createListingSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const created = await listingService.createListing(req.user!.id, req.body);
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      return next(err);
    }
  }
);

// Update listing
listingRouter.patch(
  '/:id',
  authenticate,
  validate(updateListingSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const updated = await listingService.updateListing(req.params.id, req.user!.id, req.body);
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      return next(err);
    }
  }
);

// Delete listing
listingRouter.delete('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    await listingService.deleteListing(req.params.id, req.user!.id);
    return res.status(200).json({ success: true, message: 'Listing deleted successfully' });
  } catch (err) {
    return next(err);
  }
});

// Upload voice note for SKILL listing
listingRouter.post('/:id/voice-note', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const voiceNoteUrl = req.body.voice_note_url || req.body.url;
    if (!voiceNoteUrl) {
      return res.status(400).json({ success: false, error: { message: 'voice_note_url is required' } });
    }
    const updated = await listingService.uploadVoiceNote(req.params.id, req.user!.id, voiceNoteUrl);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return next(err);
  }
});

// Flag listing
listingRouter.post('/:id/flag', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const reason = req.body.reason || 'Flagged by student';
    await listingService.flagListing(req.params.id, req.user!.id, reason);
    return res.status(200).json({ success: true, message: 'Listing has been flagged for moderation' });
  } catch (err) {
    return next(err);
  }
});

