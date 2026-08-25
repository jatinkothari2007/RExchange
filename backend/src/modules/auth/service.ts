import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { userRepo, listingRepo, transactionRepo, notificationRepo } from '../../data/repository';
import { User, KarmaTransaction } from '../../types';
import { SignupDto, VerifyOtpDto, AuthResponse, AuthTokens, UpdateProfileDto } from './types';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../utils/errors';
import { dataStore } from '../../data/store';

export interface IEmailService {
  sendOtp(email: string, otp: string): Promise<void>;
}

export class StubEmailService implements IEmailService {
  async sendOtp(email: string, otp: string): Promise<void> {
    // Stubbed email service: In production/Supabase, this delegates to Resend / SMTP / Twilio SendGrid
    console.log(`\n========================================`);
    console.log(`[COLLEGE OTP STUB] Sent OTP: ${otp} to -> ${email}`);
    console.log(`========================================\n`);
  }
}

export class AuthService {
  private emailService: IEmailService;
  private accessSecret: Secret;
  private refreshSecret: Secret;

  constructor(emailService: IEmailService = new StubEmailService()) {
    this.emailService = emailService;
    this.accessSecret = process.env.JWT_ACCESS_SECRET || 'rexchange_dev_super_secret_jwt_access_key_2026_sih';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'rexchange_dev_super_secret_jwt_refresh_key_2026_sih';
  }

  private generateTokens(user: User): AuthTokens {
    const accessExpiry: any = process.env.JWT_ACCESS_EXPIRY || '15m';
    const refreshExpiry: any = process.env.JWT_REFRESH_EXPIRY || '7d';

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      this.accessSecret,
      { expiresIn: accessExpiry }
    );

    const refreshToken = jwt.sign(
      { sub: user.id, email: user.email },
      this.refreshSecret,
      { expiresIn: refreshExpiry }
    );

    dataStore.refreshTokens.add(refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    };
  }

  async signup(dto: SignupDto): Promise<{ message: string; email: string; debugOtp?: string }> {
    const existing = await userRepo.findByEmail(dto.email);
    if (existing && existing.is_verified) {
      throw new BadRequestError('User already registered. Please request a login OTP.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

    await userRepo.saveOtp({ email: dto.email, otp, expires_at: expiresAt });

    if (!existing) {
      const initialKarma = parseInt(process.env.INITIAL_KARMA_BALANCE || '50', 10);
      const newUser: User = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        email: dto.email.toLowerCase(),
        name: dto.name,
        department: dto.department,
        year: dto.year,
        hostel_block: dto.hostel_block,
        karma_balance: initialKarma,
        role: 'student',
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await userRepo.create(newUser);
    } else {
      await userRepo.update(existing.id, {
        name: dto.name,
        department: dto.department,
        year: dto.year,
        hostel_block: dto.hostel_block,
      });
    }

    await this.emailService.sendOtp(dto.email, otp);

    return {
      message: 'College verification OTP sent to your institutional inbox',
      email: dto.email,
      debugOtp: process.env.NODE_ENV === 'development' ? otp : undefined,
    };
  }

  async requestLoginOtp(email: string): Promise<{ message: string; email: string; debugOtp?: string }> {
    const user = await userRepo.findByEmail(email);
    if (!user) {
      throw new NotFoundError('No account found with this college email. Please signup first.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    await userRepo.saveOtp({ email: user.email, otp, expires_at: expiresAt });
    await this.emailService.sendOtp(user.email, otp);

    return {
      message: 'Login OTP sent to your college email',
      email: user.email,
      debugOtp: process.env.NODE_ENV === 'development' ? otp : undefined,
    };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<AuthResponse> {
    const record = await userRepo.getOtp(dto.email);
    if (!record) {
      throw new BadRequestError('No active OTP found. Please request a new code.');
    }

    if (Date.now() > record.expires_at) {
      await userRepo.deleteOtp(dto.email);
      throw new BadRequestError('OTP has expired. Please request a new code.');
    }

    if (record.otp !== dto.otp) {
      throw new BadRequestError('Invalid OTP code.');
    }

    await userRepo.deleteOtp(dto.email);

    const user = await userRepo.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundError('User record not found.');
    }

    const wasUnverified = !user.is_verified;
    const updatedUser = (await userRepo.update(user.id, { is_verified: true })) || { ...user, is_verified: true };

    if (wasUnverified) {
      const initialKarma = parseInt(process.env.INITIAL_KARMA_BALANCE || '50', 10);
      const signupTxn: KarmaTransaction = {
        id: `txn_${Date.now()}_airdrop`,
        from_user_id: null,
        to_user_id: user.id,
        amount: initialKarma,
        type: 'SIGNUP_AIRDROP',
        description: 'Welcome to RExchange! Initial campus seed karma.',
        created_at: new Date().toISOString(),
      };
      await transactionRepo.create(signupTxn);

      await notificationRepo.create({
        id: `notif_${Date.now()}`,
        user_id: user.id,
        title: 'Welcome to RExchange!',
        message: `Your account is verified. You received ${initialKarma} Karma points to start exchanging.`,
        type: 'KARMA_EARNED',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    const tokens = this.generateTokens(updatedUser);

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        department: updatedUser.department,
        year: updatedUser.year,
        hostel_block: updatedUser.hostel_block,
        karma_balance: updatedUser.karma_balance,
        role: updatedUser.role,
        is_verified: updatedUser.is_verified,
        avatar_url: updatedUser.avatar_url,
      },
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    if (!dataStore.refreshTokens.has(refreshToken)) {
      throw new UnauthorizedError('Invalid or revoked refresh token');
    }

    try {
      const payload = jwt.verify(refreshToken, this.refreshSecret) as { sub: string };
      const user = await userRepo.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      dataStore.refreshTokens.delete(refreshToken);
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedError('Refresh token expired or invalid');
    }
  }

  async getMe(userId: string): Promise<User> {
    const user = await userRepo.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    // Trigger one-time prompt for final-year students if not yet nominated
    if (user.year >= 4 && !user.will_activated && !user.will_recipient_id) {
      const existingNotifs = await notificationRepo.findByUser(user.id);
      const hasPrompt = existingNotifs.some((n) => n.type === 'WILL_PROMPT');
      if (!hasPrompt) {
        await notificationRepo.create({
          id: `notif_will_prompt_${user.id}`,
          user_id: user.id,
          title: 'Graduating Soon? Set your Karma Will',
          message: 'Pass on your remaining Karma and unclaimed listings to a junior before you leave campus.',
          type: 'WILL_PROMPT',
          link: '/profile',
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
    }

    return user;
  }

  async setKarmaWill(senderId: string, recipientId: string): Promise<{ success: boolean; message: string; recipient: User }> {
    const sender = await userRepo.findById(senderId);
    if (!sender) throw new NotFoundError('Sender not found');

    if (sender.will_activated) {
      throw new BadRequestError('Karma Will has already been executed.');
    }

    if (senderId === recipientId) {
      throw new BadRequestError('Cannot nominate yourself as Karma Will heir.');
    }

    const recipient = await userRepo.findById(recipientId);
    if (!recipient) throw new NotFoundError('Nominated recipient junior not found');

    // In production, recipient must be a junior (lower year). In dev/test, allow same year.
    if (process.env.NODE_ENV === 'production' && recipient.year > sender.year) {
      throw new BadRequestError(`Will recipient must be a junior (Year ${recipient.year} is not junior to Year ${sender.year}).`);
    }

    await userRepo.update(senderId, { will_recipient_id: recipientId });

    await notificationRepo.create({
      id: `notif_will_nom_${Date.now()}`,
      user_id: recipient.id,
      title: 'Nominated as Karma Heir!',
      message: `${sender.name} (${sender.department}, Year ${sender.year}) nominated you as their Karma Will recipient.`,
      type: 'WILL_RECEIVED',
      link: '/profile',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Successfully nominated ${recipient.name} as your Karma Will recipient.`,
      recipient,
    };
  }

  async executeKarmaWill(senderId: string): Promise<{
    success: boolean;
    transferredKarma: number;
    transferredListingsCount: number;
    recipientName: string;
  }> {
    const sender = await userRepo.findById(senderId);
    if (!sender) throw new NotFoundError('Sender not found');

    if (sender.will_activated) {
      throw new BadRequestError('Karma Will has already been executed.');
    }

    if (!sender.will_recipient_id) {
      throw new BadRequestError('No Karma Will recipient nominated. Please nominate a junior first.');
    }

    const recipient = await userRepo.findById(sender.will_recipient_id);
    if (!recipient) throw new NotFoundError('Nominated recipient junior not found.');

    const karmaToTransfer = sender.karma_balance;

    // 1. Transfer Karma
    if (karmaToTransfer > 0) {
      await userRepo.updateKarma(recipient.id, karmaToTransfer);
      await userRepo.updateKarma(sender.id, -karmaToTransfer);

      await transactionRepo.create({
        id: `txn_will_${Date.now()}`,
        from_user_id: sender.id,
        to_user_id: recipient.id,
        amount: karmaToTransfer,
        type: 'WILL_TRANSFER',
        description: `Senior Legacy Will Transfer from ${sender.name} (${sender.department})`,
        created_at: new Date().toISOString(),
      });
    }

    // 2. Re-assign available listings from sender to recipient
    const senderListings = await listingRepo.find({ ownerId: sender.id, status: 'available' });
    for (const listing of senderListings) {
      await listingRepo.update(listing.id, {
        owner_id: recipient.id,
        willed_from_name: sender.name,
      });
    }

    // 3. Mark will activated
    await userRepo.update(sender.id, { will_activated: true });

    // 4. Send notifications
    await notificationRepo.create({
      id: `notif_will_exec_${Date.now()}`,
      user_id: recipient.id,
      title: 'Karma Will Legacy Received!',
      message: `You inherited ${karmaToTransfer} Karma Points and ${senderListings.length} resource listings from graduating senior ${sender.name}!`,
      type: 'WILL_RECEIVED',
      link: '/profile',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    return {
      success: true,
      transferredKarma: karmaToTransfer,
      transferredListingsCount: senderListings.length,
      recipientName: recipient.name,
    };
  }

  async updateMe(userId: string, dto: UpdateProfileDto): Promise<User> {
    const updated = await userRepo.update(userId, dto);
    if (!updated) throw new NotFoundError('User not found');
    return updated;
  }
}


export const authService = new AuthService();
