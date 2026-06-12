'use client';

type Props = {
  points: number;
};

export default function PointsBadge({ points }: Props) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-300 text-sm">
      {points.toLocaleString('zh-CN')} 积分
    </span>
  );
}
