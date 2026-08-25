import { listingRepo, needRepo, notificationRepo } from '../data/repository';

export class BackgroundCronManager {
  private timer: NodeJS.Timeout | null = null;
  private intervalMs: number;

  constructor(intervalMs: number = 300000) {
    this.intervalMs = intervalMs;
  }

  start() {
    console.log(`[BACKGROUND CRON] Starting simulated jobs every ${this.intervalMs / 1000}s`);
    // Run immediately on boot
    this.runAllJobs().catch((err) => console.error('[BACKGROUND CRON ERROR]', err));

    this.timer = setInterval(() => {
      this.runAllJobs().catch((err) => console.error('[BACKGROUND CRON ERROR]', err));
    }, this.intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async runAllJobs() {
    await this.autoExpireListings();
    await this.autoExpireNeeds();
    await this.inactivityNudge();
  }

  /**
   * Job 1: Auto-expire listings past expires_at
   */
  async autoExpireListings() {
    const allListings = await listingRepo.getAll();
    const now = Date.now();
    let expiredCount = 0;

    for (const listing of allListings) {
      if (listing.status === 'available' && new Date(listing.expires_at).getTime() < now) {
        await listingRepo.update(listing.id, { status: 'expired' });
        expiredCount++;

        await notificationRepo.create({
          id: `notif_${Date.now()}_exp_${listing.id}`,
          user_id: listing.owner_id,
          title: 'Listing Expired ⏰',
          message: `Your listing "${listing.title}" reached its expiry date and is now archived.`,
          type: 'REMINDER',
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
    }

    if (expiredCount > 0) {
      console.log(`[BACKGROUND CRON] Auto-expired ${expiredCount} listings.`);
    }
  }

  /**
   * Job 2: Auto-expire needs past target_deadline
   */
  async autoExpireNeeds() {
    const allNeeds = await needRepo.getAll('open');
    const now = Date.now();
    let expiredCount = 0;

    for (const need of allNeeds) {
      if (new Date(need.target_deadline).getTime() < now) {
        await needRepo.update(need.id, { status: 'expired' });
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      console.log(`[BACKGROUND CRON] Auto-expired ${expiredCount} past-deadline urgent needs.`);
    }
  }

  /**
   * Job 3: Inactivity nudge: notify owners of listings untouched 14+ days
   */
  async inactivityNudge() {
    const allListings = await listingRepo.getAll();
    const now = Date.now();
    const fourteenDaysMs = 14 * 86400000;

    for (const listing of allListings) {
      if (listing.status === 'available') {
        const lastActive = new Date(listing.last_activity_at || listing.created_at).getTime();
        if (now - lastActive > fourteenDaysMs) {
          await notificationRepo.create({
            id: `notif_${Date.now()}_nudge_${listing.id}`,
            user_id: listing.owner_id,
            title: 'Is your item still available? 📦',
            message: `"${listing.title}" hasn't had recent activity. Boost or renew its karma value!`,
            type: 'REMINDER',
            is_read: false,
            created_at: new Date().toISOString(),
          });
        }
      }
    }
  }
}

export const cronManager = new BackgroundCronManager(
  parseInt(process.env.BACKGROUND_CLEANUP_INTERVAL_MS || '300000', 10)
);
