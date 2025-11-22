import type { Document, Types } from 'mongoose';
import { CursorPaginationParams } from '~/common';

export interface IUser extends Document {
  name?: string;
  username?: string;
  email?: string;
  emailVerified?: boolean;
  password?: string;
  phone?: string;
  phoneVerified?: boolean;
  otp?: string;
  otpExpires?: Date;
  referralCode?: string;
  referralCodeUsed?: string | null;
  referredBy?: Types.ObjectId | string | null;
  avatar?: string;
  provider: string;
  role?: string;
  googleId?: string;
  facebookId?: string;
  openidId?: string;
  samlId?: string;
  ldapId?: string;
  githubId?: string;
  discordId?: string;
  appleId?: string;
  plugins?: string[];
  twoFactorEnabled?: boolean;
  totpSecret?: string;
  backupCodes?: Array<{
    codeHash: string;
    used: boolean;
    usedAt?: Date | null;
  }>;
  refreshToken?: Array<{
    refreshToken: string;
  }>;
  expiresAt?: Date;
  termsAccepted?: boolean;
  personalization?: {
    memories?: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
  /** Field for external source identification (for consistency with TPrincipal schema) */
  idOnTheSource?: string;
}

export interface BalanceConfig {
  enabled?: boolean;
  startBalance?: number;
  autoRefillEnabled?: boolean;
  refillIntervalValue?: number;
  refillIntervalUnit?: string;
  refillAmount?: number;
}

export interface CreateUserRequest extends Partial<IUser> {}

export interface UpdateUserRequest {
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  phoneVerified?: boolean;
  role?: string;
  emailVerified?: boolean;
  avatar?: string;
  plugins?: string[];
  twoFactorEnabled?: boolean;
  termsAccepted?: boolean;
  personalization?: {
    memories?: boolean;
  };
  dailyTokenLimit?: number;
  dailyTokenUsed?: number;
  tokenUsageResetAt?: Date | null;
  restrictedUntil?: Date | null;
  revoked?: boolean;
  referralCode?: string;
  referredBy?: string | Types.ObjectId | null;
  referralCodeUsed?: string | null;
}

export interface UserDeleteResult {
  deletedCount: number;
  message: string;
}

export interface UserFilterOptions extends CursorPaginationParams {
  _id?: Types.ObjectId | string;
  // Includes email, username and name
  search?: string;
  role?: string;
  emailVerified?: boolean;
  provider?: string;
  twoFactorEnabled?: boolean;
  phone?: string;
  // External IDs
  googleId?: string;
  facebookId?: string;
  openidId?: string;
  samlId?: string;
  ldapId?: string;
  githubId?: string;
  discordId?: string;
  appleId?: string;
  // Date filters
  createdAfter?: string;
  createdBefore?: string;
}

export interface UserQueryOptions {
  fieldsToSelect?: string | string[] | null;
  lean?: boolean;
}
