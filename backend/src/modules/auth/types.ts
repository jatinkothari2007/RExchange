export interface SignupDto {
  email: string;
  name: string;
  department: string;
  year: number;
  hostel_block: string;
}

export interface VerifyOtpDto {
  email: string;
  otp: string;
}

export interface LoginDto {
  email: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface UpdateProfileDto {
  name?: string;
  department?: string;
  year?: number;
  hostel_block?: string;
  avatar_url?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    department: string;
    year: number;
    hostel_block: string;
    karma_balance: number;
    role: string;
    is_verified: boolean;
    avatar_url?: string;
  };
  tokens: AuthTokens;
}
