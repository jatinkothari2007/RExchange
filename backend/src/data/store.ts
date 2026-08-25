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
  ImpactStats
} from '../types';

export interface OtpRecord {
  email: string;
  otp: string;
  expires_at: number;
}

export interface DisputeRecord {
  id: string;
  exchange_id: string;
  raised_by: string;
  reason: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export interface FlaggedListingRecord {
  id: string;
  listing_id: string;
  flagged_by: string;
  reason: string;
  created_at: string;
}

class InMemoryDataStore {
  public users = new Map<string, User>();
  public userPasswords = new Map<string, string>(); // hashed passwords or plain for mock
  public otps = new Map<string, OtpRecord>(); // email -> otp
  public refreshTokens = new Set<string>();

  public listings = new Map<string, Listing>();
  public bundles = new Map<string, ListingBundle>();
  public loans = new Map<string, KarmaLoan>();
  public needs = new Map<string, UrgentNeed>();
  public exchanges = new Map<string, Exchange>();
  public messages = new Map<string, Message[]>(); // exchange_id -> Message[]
  public ratings = new Map<string, ReputationRating>();
  public transactions = new Map<string, KarmaTransaction>();
  public notifications = new Map<string, Notification[]>(); // user_id -> Notification[]
  public flaggedListings = new Map<string, FlaggedListingRecord>();
  public disputes = new Map<string, DisputeRecord>();
  public matchFeedback = new Map<string, { user_id: string; listing_id: string; thumbs_up: boolean; created_at: string }>();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed 3 realistic SRM college student personas
    const user1: User = {
      id: 'usr_aarav_01',
      email: 'aarav.sharma@srmist.edu.in',
      name: 'Aarav Sharma',
      department: 'Computer Science & Engineering',
      year: 3,
      hostel_block: 'Java Block 3',
      karma_balance: 145,
      role: 'student',
      is_verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    const user2: User = {
      id: 'usr_priya_02',
      email: 'priya.nair@srmist.edu.in',
      name: 'Priya Nair',
      department: 'Electronics & Communication',
      year: 4,
      hostel_block: 'Kalpana Chawla Block B',
      karma_balance: 210,
      role: 'student',
      is_verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    const user3: User = {
      id: 'usr_rohan_03',
      email: 'rohan.gupta@srmist.edu.in',
      name: 'Rohan Gupta',
      department: 'Mechanical Engineering',
      year: 2,
      hostel_block: 'Adhiyaman Hostel',
      karma_balance: 85,
      role: 'student',
      is_verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    const adminUser: User = {
      id: 'usr_admin_00',
      email: 'admin.rexchange@srmist.edu.in',
      name: 'RExchange Campus Lead',
      department: 'Dean of Student Affairs',
      year: 4,
      hostel_block: 'Tech Park Admin',
      karma_balance: 1000,
      role: 'admin',
      is_verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.users.set(user1.id, user1);
    this.users.set(user2.id, user2);
    this.users.set(user3.id, user3);
    this.users.set(adminUser.id, adminUser);

    // Seed Listings across all 5 unified types
    const listing1: Listing = {
      id: 'lst_casio_991',
      owner_id: user1.id,
      type: 'ITEM',
      title: 'Casio fx-991EX Scientific Calculator (ClassWiz)',
      description: 'Used for two semesters of Engineering Maths. Works perfectly with solar power. Includes snap-on hard case.',
      category: 'Electronics & Lab Equipment',
      tags: ['calculator', 'casio', 'maths', 'lab', 'engineering'],
      karma_value: 35,
      status: 'available',
      pickup_point: 'Java Block 3 Ground Floor or Central Library Bench',
      condition: 'like_new',
      original_price_est: 1450,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      expires_at: new Date(Date.now() + 28 * 86400000).toISOString(),
      last_activity_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    };

    const listing2: Listing = {
      id: 'lst_os_notes',
      owner_id: user2.id,
      type: 'NOTE',
      title: 'Handwritten OS & Concurrency Notes (End-Sem Ready)',
      description: 'Concise diagrams for CPU scheduling, Deadlocks, Semaphore synchronization problems, and Memory Paging algorithms.',
      category: 'Study Notes & Academics',
      tags: ['operating-systems', 'cse', 'handwritten', 'exam-prep', 'gate'],
      karma_value: 20,
      status: 'available',
      pickup_point: 'Digital PDF link + Spiral Copy available at KC Block B',
      subject: 'Operating Systems (18CSC302J)',
      semester: 5,
      page_count: 74,
      file_url: 'https://cdn.rexchange.srmist.edu/notes/os_complete_2026.pdf',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      expires_at: new Date(Date.now() + 45 * 86400000).toISOString(),
      last_activity_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    };

    const listing3: Listing = {
      id: 'lst_milan_pass',
      owner_id: user3.id,
      type: 'TICKET',
      title: 'Milan 2026 EDM Pro-Nite VIP Entry Pass',
      description: 'Got an extra pass for the international DJ night, can’t attend due to internal lab test reschedule.',
      category: 'Campus Events & Cultural',
      tags: ['milan', 'fest', 'edm', 'pronite', 'pass'],
      karma_value: 30,
      status: 'available',
      pickup_point: 'TP Ganesan Auditorium Gate 2',
      event_name: 'Milan Pro-Nite EDM Fest 2026',
      event_date: new Date(Date.now() + 3 * 86400000).toISOString(),
      venue: 'TP Ganesan Auditorium Outdoor Arena',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      expires_at: new Date(Date.now() + 3 * 86400000).toISOString(),
      last_activity_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    };

    const listing4: Listing = {
      id: 'lst_react_tutoring',
      owner_id: user1.id,
      type: 'SKILL',
      title: '1-on-1 Fullstack React & System Design Crash Course (60 mins)',
      description: 'Will debug your project repo, guide you through State Management, API integration, and prepare you for technical rounds.',
      category: 'Skills & Mentorship',
      tags: ['react', 'web-dev', 'tutoring', 'frontend', 'mentorship'],
      karma_value: 40,
      status: 'available',
      pickup_point: 'UB 3rd Floor Co-working Area or Google Meet',
      skill_category: 'Full-Stack Software Development',
      duration_minutes: 60,
      session_mode: 'in_person',
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      expires_at: new Date(Date.now() + 60 * 86400000).toISOString(),
      last_activity_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    };

    const listing5: Listing = {
      id: 'lst_hackathon_slot',
      owner_id: user2.id,
      type: 'OPPORTUNITY',
      title: 'Shortlisted SIH Hardware Team - Looking for 1 Embedded C/IoT Dev',
      description: 'Our team is qualified for Grand Finale. One member dropped out. Looking for an enthusiastic 2nd/3rd year to build the smart irrigation node.',
      category: 'Opportunities & Gigs',
      tags: ['sih', 'hackathon', 'iot', 'hardware', 'teammate'],
      karma_value: 15,
      status: 'available',
      pickup_point: 'Tech Park FabLab 6th Floor',
      organization: 'SRM Smart India Hackathon Hub',
      role_title: 'Firmware / ESP32 Developer',
      application_deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      expires_at: new Date(Date.now() + 5 * 86400000).toISOString(),
      last_activity_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    };

    this.listings.set(listing1.id, listing1);
    this.listings.set(listing2.id, listing2);
    this.listings.set(listing3.id, listing3);
    this.listings.set(listing4.id, listing4);
    this.listings.set(listing5.id, listing5);

    // Seed Urgent Needs
    const need1: UrgentNeed = {
      id: 'ned_calculator_emergency',
      requester_id: user3.id,
      title: 'Need scientific calculator for Engineering Mechanics exam at 2 PM today!',
      description: 'Forgot my calculator at home over the weekend, exam starts in 3 hours at Tech Park 404.',
      category: 'Electronics & Lab Equipment',
      tags: ['calculator', 'exam', 'emergency', 'mechanics'],
      max_karma_offered: 45,
      target_deadline: new Date(Date.now() + 3 * 3600000).toISOString(),
      hostel_block: 'Adhiyaman Hostel',
      status: 'open',
      created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    };

    const need2: UrgentNeed = {
      id: 'ned_dsa_notes',
      requester_id: user1.id,
      title: 'Need unit 4 & 5 AVL Tree / Graph algorithms handwritten summary',
      description: 'Need before tomorrow morning 9 AM slot for quick revision.',
      category: 'Study Notes & Academics',
      tags: ['dsa', 'graphs', 'notes', 'exam'],
      max_karma_offered: 30,
      target_deadline: new Date(Date.now() + 20 * 3600000).toISOString(),
      hostel_block: 'Java Block 3',
      status: 'open',
      created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    };

    this.needs.set(need1.id, need1);
    this.needs.set(need2.id, need2);

    const pastExchange: Exchange = {
      id: 'exc_seed_past_01',
      listing_id: listing2.id,
      giver_id: user2.id,
      receiver_id: user1.id,
      agreed_karma: 20,
      status: 'COMPLETED',
      giver_confirmed: true,
      receiver_confirmed: true,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 9 * 86400000).toISOString(),
      completed_at: new Date(Date.now() - 9 * 86400000).toISOString(),
    };
    this.exchanges.set(pastExchange.id, pastExchange);

    const rohanPastExchange: Exchange = {
      id: 'exc_seed_past_rohan_02',
      listing_id: listing5.id,
      giver_id: user3.id,
      receiver_id: user2.id,
      agreed_karma: 35,
      status: 'COMPLETED',
      giver_confirmed: true,
      receiver_confirmed: true,
      created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 11 * 86400000).toISOString(),
      completed_at: new Date(Date.now() - 11 * 86400000).toISOString(),
    };
    this.exchanges.set(rohanPastExchange.id, rohanPastExchange);

    const pastRating: ReputationRating = {
      id: 'rat_seed_01',
      exchange_id: pastExchange.id,
      reviewer_id: user1.id,
      target_user_id: user2.id,
      rating: 5,
      feedback_tags: ['on time', 'notes very clean', 'quick response'],
      comment: 'Awesome notes! Covered all previous year questions accurately.',
      created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
    };
    this.ratings.set(pastRating.id, pastRating);

    // Seed initial bundles for instant demo testing
    const bundle1: ListingBundle = {
      id: 'bdl_seed_ece_pack',
      owner_id: user2.id,
      title: '5th Sem Exam Prep & Hardware Kit',
      description: 'Includes complete Handwritten OS & Concurrency notes + SIH Shortlisted IoT hardware guide in one package.',
      karma_value: 30,
      status: 'available',
      listing_ids: [listing2.id, listing4.id],
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    };

    const bundle2: ListingBundle = {
      id: 'bdl_seed_tech_starter',
      owner_id: user1.id,
      title: 'Complete Engineering Maths & Lab Bundle',
      description: 'Casio fx-991EX ClassWiz + 1-on-1 Fullstack React system design mentoring session.',
      karma_value: 55,
      status: 'available',
      listing_ids: [listing1.id, listing5.id],
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    };

    this.bundles.set(bundle1.id, bundle1);
    this.bundles.set(bundle2.id, bundle2);

    // Seed transaction ledger record
    const txn1: KarmaTransaction = {
      id: 'txn_seed_01',
      from_user_id: user1.id,
      to_user_id: user2.id,
      amount: 20,
      type: 'EXCHANGE',
      reference_id: pastExchange.id,
      description: 'Exchange for Handwritten OS & Concurrency Notes',
      created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
    };
    this.transactions.set(txn1.id, txn1);

    // Seed notifications for users
    this.notifications.set(user1.id, [
      {
        id: 'notif_01',
        user_id: user1.id,
        title: 'New AI Match Found!',
        message: 'A student near Java Block listed "Casio fx-991EX" matching your past need.',
        type: 'MATCH_ALERT',
        link: '/listings/lst_casio_991',
        is_read: false,
        created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
      },
    ]);

    this.notifications.set(user2.id, [
      {
        id: 'notif_02',
        user_id: user2.id,
        title: 'Karma Earned (+20)',
        message: 'Aarav confirmed receipt of OS Notes. 20 Karma added to your balance!',
        type: 'KARMA_EARNED',
        link: '/profile',
        is_read: true,
        created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
      },
    ]);
  }
}

export const dataStore = new InMemoryDataStore();
