'use client';

import { getTeamFlag, getTeamFlagAlt } from '../lib/utils';

export default function TeamFlag({ team, size = 24 }: { team: string; size?: number }) {
  const src = getTeamFlag(team);
  if (!src) return null;
  return (
    <img
      src={src}
      alt={getTeamFlagAlt(team)}
      width={size}
      height={Math.round(size * 0.75)}
      className="inline-block rounded-sm"
      loading="lazy"
    />
  );
}
