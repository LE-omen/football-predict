'use client';

type Props = {
  points: number;
};

export default function PointsBadge({ points }: Props) {
  return (
    <span className="badge-accent">
      🪙 {points.toLocaleString('zh-CN')} 金币
    </span>
  );
}
