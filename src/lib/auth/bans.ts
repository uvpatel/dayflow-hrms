export interface UserBanState {
  banned: boolean | null;
  banExpires: Date | null;
}

/** A ban without an expiry remains active until an administrator clears it. */
export function isActiveUserBan(
  state: UserBanState,
  now = Date.now(),
): boolean {
  if (!state.banned) return false;
  return state.banExpires == null || state.banExpires.getTime() >= now;
}
