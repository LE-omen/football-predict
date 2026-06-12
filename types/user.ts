// types/user.ts
import type { UserRole } from './database';

export type SafeUser = {
  id: string;
  nickname: string;
  role: UserRole;
  points: number;
};
