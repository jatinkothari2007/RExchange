import {
  User,
  Listing,
  ListingBundle,
  KarmaLoan,
  SpotlightItem,
  UrgentNeed,
  Exchange,
  Message,
  UserReputation,
  ImpactStats,
  Notification,
  MatchSuggestion,
  LeaderboardEntry,
  GroupLeaderboardEntry
} from '../types';

const API_BASE = '/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('rexchange_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      let errorMessage = data.error?.message || 'API request failed';
      if (data.error?.details && Array.isArray(data.error.details) && data.error.details.length > 0) {
        const detailsStr = data.error.details.map((d: any) => `${d.path ? d.path.replace(/^body\./, '') + ': ' : ''}${d.message}`).join(', ');
        errorMessage = `${errorMessage} (${detailsStr})`;
      }
      throw new Error(errorMessage);
    }
    return data.data !== undefined ? data.data : data;
  }

  // ==================== AUTH & USER ====================
  async signup(data: { email: string; name: string; department: string; year: number; hostel_block: string }) {
    return this.request<{ message: string; email: string; debugOtp?: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async requestLogin(email: string) {
    return this.request<{ message: string; email: string; debugOtp?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOtp(email: string, otp: string) {
    return this.request<{ user: User; tokens: { accessToken: string; refreshToken: string } }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async getMe() {
    return this.request<User>('/users/me');
  }

  async updateProfile(updates: Partial<User>) {
    return this.request<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // ==================== FEATURE 1: KARMA WILL ====================
  async getJuniors() {
    return this.request<User[]>('/users/juniors');
  }

  async setKarmaWill(recipientId: string) {
    return this.request<{ success: boolean; message: string; recipient: User }>('/users/me/will', {
      method: 'POST',
      body: JSON.stringify({ recipient_id: recipientId }),
    });
  }

  async executeKarmaWill() {
    return this.request<{
      success: boolean;
      transferredKarma: number;
      transferredListingsCount: number;
      recipientName: string;
    }>('/users/me/will/execute', {
      method: 'POST',
    });
  }

  // ==================== LISTINGS & VOICE NOTES ====================
  async getListings(filters: { type?: string; category?: string; q?: string; status?: string } = {}) {
    const params = new URLSearchParams();
    if (filters.type && filters.type !== 'ALL') params.append('type', filters.type);
    if (filters.category) params.append('category', filters.category);
    if (filters.q) params.append('q', filters.q);
    if (filters.status) params.append('status', filters.status);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Listing[]>(`/listings${query}`);
  }

  async getListingById(id: string) {
    return this.request<Listing>(`/listings/${id}`);
  }

  async createListing(listingData: any) {
    return this.request<Listing>('/listings', {
      method: 'POST',
      body: JSON.stringify(listingData),
    });
  }

  async uploadVoiceNote(listingId: string, voiceNoteUrl: string) {
    return this.request<Listing>(`/listings/${listingId}/voice-note`, {
      method: 'POST',
      body: JSON.stringify({ voice_note_url: voiceNoteUrl }),
    });
  }

  async suggestKarma(data: {
    type: string;
    category?: string;
    original_price_est?: number;
    condition?: string;
    duration_minutes?: number;
    page_count?: number;
    tags?: string[];
  }) {
    return this.request<{
      suggestedKarma: number;
      minAllowedKarma: number;
      maxAllowedKarma: number;
      reasoning: string;
    }>('/listings/suggest-karma', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteListing(id: string) {
    return this.request<{ success: boolean; message: string }>(`/listings/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== FEATURE 2: BUNDLE TRADES ====================
  async getBundles(status: string = 'available') {
    return this.request<ListingBundle[]>(`/bundles?status=${status}`);
  }

  async getBundleById(id: string) {
    return this.request<ListingBundle>(`/bundles/${id}`);
  }

  async createBundle(data: { title: string; description: string; karma_value: number; listing_ids: string[] }) {
    return this.request<ListingBundle>('/bundles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async requestBundleExchange(bundleId: string, notes?: string) {
    return this.request<Exchange>(`/bundles/${bundleId}/exchange`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  // ==================== FEATURE 5: EMERGENCY KARMA LOANS ====================
  async requestLoan(amount: number) {
    return this.request<{ loan: KarmaLoan; newBalance: number }>('/loans/request', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async getMyLoans() {
    return this.request<{ loans: KarmaLoan[]; active: KarmaLoan | null }>('/loans/me');
  }

  // ==================== FEATURE 6: CROSS-DEPARTMENT SPOTLIGHT ====================
  async getCrossDepartmentSpotlight() {
    return this.request<SpotlightItem[]>('/spotlight/cross-department');
  }

  // ==================== URGENT NEEDS ====================
  async getNeeds(sortBy: 'urgency' | 'latest' = 'urgency') {
    return this.request<UrgentNeed[]>(`/needs?sort=${sortBy}`);
  }

  async createNeed(needData: { title: string; description: string; category: string; tags: string[]; max_karma_offered: number; target_deadline: string; hostel_block: string }) {
    return this.request<UrgentNeed>('/needs', {
      method: 'POST',
      body: JSON.stringify(needData),
    });
  }

  async fulfillNeed(needId: string, notes?: string) {
    return this.request<{ need: UrgentNeed; karmaTransferred: number; fulfillerBonusEarned: number; requesterBonusCashback: number }>(`/needs/${needId}/fulfill`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  // ==================== AI SMART MATCH ====================
  async getSuggestions(limit: number = 6) {
    return this.request<MatchSuggestion[]>(`/match/suggestions?limit=${limit}`);
  }

  async sendMatchFeedback(listingId: string, thumbsUp: boolean) {
    return this.request<{ message: string }>('/match/feedback', {
      method: 'POST',
      body: JSON.stringify({ listing_id: listingId, thumbs_up: thumbsUp }),
    });
  }

  // ==================== EXCHANGES & FEATURE 7: QR HANDOFF ====================
  async getExchanges() {
    return this.request<Exchange[]>('/exchanges');
  }

  async getExchangeById(id: string) {
    return this.request<Exchange>(`/exchanges/${id}`);
  }

  async requestExchange(listingId: string, agreedKarma?: number, notes?: string) {
    return this.request<Exchange>('/exchanges', {
      method: 'POST',
      body: JSON.stringify({ listing_id: listingId, agreed_karma: agreedKarma, notes }),
    });
  }

  async acceptExchange(exchangeId: string) {
    return this.request<Exchange>(`/exchanges/${exchangeId}/accept`, {
      method: 'PATCH',
    });
  }

  async confirmHandoff(exchangeId: string) {
    return this.request<{ exchange: Exchange; completed: boolean; karmaTransferred?: number }>(`/exchanges/${exchangeId}/confirm-handoff`, {
      method: 'PATCH',
    });
  }

  async scanHandoff(exchangeId: string, code: string) {
    return this.request<{ exchange: Exchange; completed: boolean; karmaTransferred?: number }>(`/exchanges/${exchangeId}/handoff-scan`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async cancelExchange(exchangeId: string, reason: string) {
    return this.request<Exchange>(`/exchanges/${exchangeId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  // ==================== CHAT & NEGOTIATION ====================
  async getMessages(exchangeId: string) {
    return this.request<Message[]>(`/exchanges/${exchangeId}/messages`);
  }

  async sendMessage(exchangeId: string, content: string, type: 'text' | 'propose_karma' = 'text', proposedKarma?: number) {
    return this.request<Message>(`/exchanges/${exchangeId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, type, proposed_karma: proposedKarma }),
    });
  }

  async respondToProposal(exchangeId: string, messageId: string, action: 'accept' | 'reject') {
    return this.request<{ message: Message; updatedAgreedKarma?: number }>(`/exchanges/${exchangeId}/messages/${messageId}/respond`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    });
  }

  // ==================== REPUTATION ====================
  async rateExchange(exchangeId: string, rating: number, feedbackTags: string[], comment?: string) {
    return this.request<any>(`/exchanges/${exchangeId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, feedback_tags: feedbackTags, comment }),
    });
  }

  async getUserReputation(userId: string) {
    return this.request<UserReputation>(`/users/${userId}/reputation`);
  }

  // ==================== IMPACT ====================
  async getPersonalImpact() {
    return this.request<ImpactStats>('/impact/me');
  }

  async getCampusImpact() {
    return this.request<ImpactStats>('/impact/campus');
  }

  // ==================== LEADERBOARD ====================
  async getLeaderboard(scope: 'week' | 'alltime' = 'alltime', groupBy?: 'department' | 'hostel') {
    const params = new URLSearchParams({ scope });
    if (groupBy) params.append('groupBy', groupBy);
    return this.request<{ scope: string; grouped_by?: string; entries: any[]; currentUserRank?: LeaderboardEntry | null }>(`/leaderboard?${params.toString()}`);
  }

  // ==================== NOTIFICATIONS ====================
  async getNotifications() {
    return this.request<Notification[]>('/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request<{ updated: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead() {
    return this.request<{ message: string }>('/notifications/read-all', {
      method: 'PATCH',
    });
  }
}

export const api = new ApiClient();
