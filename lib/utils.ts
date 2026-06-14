// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function points(n: number) {
  return new Intl.NumberFormat('zh-CN').format(n);
}

export function minutesBetween(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / (1000 * 60);
}

// 球队国旗 emoji 映射
export const TEAM_FLAGS: Record<string, string> = {
  '巴西': '🇧🇷', '阿根廷': '🇦🇷', '法国': '🇫🇷', '英格兰': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  '西班牙': '🇪🇸', '葡萄牙': '🇵🇹', '德国': '🇩🇪', '荷兰': '🇳🇱',
  '比利时': '🇧🇪', '克罗地亚': '🇭🇷', '摩洛哥': '🇲🇦', '日本': '🇯🇵',
  '韩国': '🇰🇷', '澳大利亚': '🇦🇺', '美国': '🇺🇸', '墨西哥': '🇲🇽',
  '哥伦比亚': '🇨🇴', '乌拉圭': '🇺🇾', '厄瓜多尔': '🇪🇨', '塞内加尔': '🇸🇳',
  '突尼斯': '🇹🇳', '喀麦隆': '🇨🇲', '加纳': '🇬🇭', '尼日利亚': '🇳🇬',
  '埃及': '🇪🇬', '沙特阿拉伯': '🇸🇦', '伊朗': '🇮🇷', '卡塔尔': '🇶🇦',
  '伊拉克': '🇮🇶', '阿联酋': '🇦🇪', '约旦': '🇯🇴', '乌兹别克斯坦': '🇺🇿',
  '加拿大': '🇨🇦', '巴拿马': '🇵🇦', '海地': '🇭🇹', '洪都拉斯': '🇭🇳',
  '新西兰': '🇳🇿', '苏格兰': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '瑞士': '🇨🇭', '奥地利': '🇦🇹',
  '瑞典': '🇸🇪', '挪威': '🇳🇴', '波兰': '🇵🇱', '捷克': '🇨🇿',
  '塞尔维亚': '🇷🇸', '波黑': '🇧🇦', '阿尔及利亚': '🇩🇿', '科特迪瓦': '🇨🇮',
  '南非': '🇿🇦', '佛得角': '🇨🇻', '库拉索': '🇨🇼', '刚果民主共和国': '🇨🇩',
  '巴拉圭': '🇵🇾', '土耳其': '🇹🇷', '斐济': '🇫🇯',
};

/** 获取球队对应的国旗 emoji */
export function getTeamFlag(teamName: string): string {
  return TEAM_FLAGS[teamName] ?? '';
}
