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

// 球队 -> 国家代码映射 (ISO 3166-1 alpha-2, lowercase)
export const TEAM_COUNTRY_CODE: Record<string, string> = {
  '巴西': 'br', '阿根廷': 'ar', '法国': 'fr', '英格兰': 'gb',
  '西班牙': 'es', '葡萄牙': 'pt', '德国': 'de', '荷兰': 'nl',
  '比利时': 'be', '克罗地亚': 'hr', '摩洛哥': 'ma', '日本': 'jp',
  '韩国': 'kr', '澳大利亚': 'au', '美国': 'us', '墨西哥': 'mx',
  '哥伦比亚': 'co', '乌拉圭': 'uy', '厄瓜多尔': 'ec', '塞内加尔': 'sn',
  '突尼斯': 'tn', '喀麦隆': 'cm', '加纳': 'gh', '尼日利亚': 'ng',
  '埃及': 'eg', '沙特阿拉伯': 'sa', '伊朗': 'ir', '卡塔尔': 'qa',
  '伊拉克': 'iq', '阿联酋': 'ae', '约旦': 'jo', '乌兹别克斯坦': 'uz',
  '加拿大': 'ca', '巴拿马': 'pa', '海地': 'ht', '洪都拉斯': 'hn',
  '新西兰': 'nz', '苏格兰': 'gb-sct', '瑞士': 'ch', '奥地利': 'at',
  '挪威': 'no', '波兰': 'pl', '捷克': 'cz',
  '塞尔维亚': 'rs', '波黑': 'ba', '阿尔及利亚': 'dz', '科特迪瓦': 'ci',
  '南非': 'za', '佛得角': 'cv', '库拉索': 'cw', '刚果民主共和国': 'cd',
  '巴拉圭': 'py', '土耳其': 'tr', '斐济': 'fj', '瑞典': 'se',
};

// 英文名映射 (用于 flagcdn)
export const TEAM_FLAG_EN: Record<string, string> = {
  '巴西': 'brazil', '阿根廷': 'argentina', '法国': 'france', '英格兰': 'england',
  '西班牙': 'spain', '葡萄牙': 'portugal', '德国': 'germany', '荷兰': 'netherlands',
  '比利时': 'belgium', '克罗地亚': 'croatia', '摩洛哥': 'morocco', '日本': 'japan',
  '韩国': 'south-korea', '澳大利亚': 'australia', '美国': 'us', '墨西哥': 'mexico',
  '哥伦比亚': 'colombia', '乌拉圭': 'uruguay', '厄瓜多尔': 'ecuador', '塞内加尔': 'senegal',
  '突尼斯': 'tunisia', '喀麦隆': 'cameroon', '加纳': 'ghana', '尼日利亚': 'nigeria',
  '埃及': 'egypt', '沙特阿拉伯': 'saudi-arabia', '伊朗': 'iran', '卡塔尔': 'qatar',
  '伊拉克': 'iraq', '阿联酋': 'uae', '约旦': 'jordan', '乌兹别克斯坦': 'uzbekistan',
  '加拿大': 'canada', '巴拿马': 'panama', '海地': 'haiti', '洪都拉斯': 'honduras',
  '新西兰': 'new-zealand', '苏格兰': 'scotland', '瑞士': 'switzerland', '奥地利': 'austria',
  '瑞典': 'sweden', '挪威': 'norway', '波兰': 'poland', '捷克': 'czech-republic',
  '塞尔维亚': 'serbia', '波黑': 'bosnia', '阿尔及利亚': 'algeria', '科特迪瓦': 'ivory-coast',
  '南非': 'south-africa', '佛得角': 'cape-verde', '库拉索': 'curacao', '刚果民主共和国': 'dr-congo',
  '巴拉圭': 'paraguay', '土耳其': 'turkey', '斐济': 'fiji',
};

/** 获取球队国旗图片 URL (使用 flagcdn.com) */
export function getTeamFlag(teamName: string): string {
  const code = TEAM_COUNTRY_CODE[teamName];
  if (!code) return '';
  // flagcdn uses 2-letter codes; 苏格兰用 scotland
  const flagEn = TEAM_FLAG_EN[teamName] || code;
  return `https://flagcdn.com/48x36/${code}.png`;
}

/** 获取球队国旗的 alt 文本 */
export function getTeamFlagAlt(teamName: string): string {
  return teamName + '国旗';
}
