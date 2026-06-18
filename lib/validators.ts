// lib/validators.ts
import { STAKE_MIN, STAKE_MAX } from './constants';

export function isValidStake(value: number) {
  if (!Number.isFinite(value)) return false;
  if (value < STAKE_MIN || value > STAKE_MAX) return false;
  return true;
}

export function isValidNickname(nickname: string) {
  return typeof nickname === 'string' && nickname.trim().length >= 2 && nickname.trim().length <= 24;
}

export function isValidPassword(password: string) {
  return typeof password === 'string' && password.length >= 6 && password.length <= 72;
}

export function isValidInviteCode(code: string) {
  return typeof code === 'string' && code.trim().length >= 1 && code.trim().length <= 64;
}
