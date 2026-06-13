'use client';

type Props = {
  points: number;
};

export default function PointsBadge({ points }: Props) {
  return (
    <span className="badge-accent">
      {points.toLocaleString('zh-CN')} 积分
    </span>
  );
}
