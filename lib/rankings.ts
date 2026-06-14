export interface TeamRanking {
  rank: number;
  team: string;
  group: string;
  tier: string;
  comment: string;
  tags: [string, string];
}

export const WORLD_CUP_RANKINGS: TeamRanking[] = [
  { rank: 1, team: '西班牙', group: 'H', tier: '争冠一档', comment: '欧洲冠军，体系最成熟', tags: ['控球传导', '肋部渗透'] },
  { rank: 2, team: '法国', group: 'I', tier: '争冠一档', comment: '阵容深度最厚，姆巴佩核心', tags: ['巨星质量', '攻守均衡'] },
  { rank: 3, team: '阿根廷', group: 'J', tier: '争冠一档', comment: 'FIFA第1，卫冕冠军', tags: ['控节奏', '大赛经验'] },
  { rank: 4, team: '英格兰', group: 'L', tier: '争冠一档', comment: '阵容身价、英超核心密度极强', tags: ['阵容深度', '定位球强'] },
  { rank: 5, team: '葡萄牙', group: 'K', tier: '争冠/四强档', comment: '纸面天赋豪华', tags: ['阵容豪华', '边路爆点'] },
  { rank: 6, team: '巴西', group: 'C', tier: '争冠/四强档', comment: '个人能力顶级', tags: ['天赋爆点', '前场压制'] },
  { rank: 7, team: '哥伦比亚', group: 'K', tier: '深度黑马', comment: '近两年南美竞争力强', tags: ['技术反击', '边路速度'] },
  { rank: 8, team: '德国', group: 'E', tier: '深度淘汰赛档', comment: '大赛底蕴强，穆西亚拉领衔', tags: ['控球压制', '多点进攻'] },
  { rank: 9, team: '荷兰', group: 'F', tier: '深度淘汰赛档', comment: '防线和中场硬度好', tags: ['后场出球', '锋线疑问'] },
  { rank: 10, team: '比利时', group: 'G', tier: '深度淘汰赛档', comment: '德布劳内仍能决定比赛', tags: ['老将经验', '进攻创造'] },
  { rank: 11, team: '摩洛哥', group: 'C', tier: '深度淘汰赛档', comment: '2022四强后不再是冷门', tags: ['防守铁军', '反击锋利'] },
  { rank: 12, team: '乌拉圭', group: 'H', tier: '深度淘汰赛档', comment: '巴尔韦德等中场硬度强', tags: ['南美强度', '前场冲击'] },
  { rank: 13, team: '克罗地亚', group: 'L', tier: '深度淘汰赛档', comment: '大赛经验极强', tags: ['中场大师', '老将经验'] },
  { rank: 14, team: '日本', group: 'F', tier: '16强强队', comment: '亚洲最成熟体系之一', tags: ['整体流畅', '反击细腻'] },
  { rank: 15, team: '墨西哥', group: 'A', tier: '16强强队', comment: '主场加成大', tags: ['主场红利', '高压逼抢'] },
  { rank: 16, team: '美国', group: 'D', tier: '16强强队', comment: '主场+4-1开局大幅加分', tags: ['主场气势', '高速压迫'] },
  { rank: 17, team: '瑞士', group: 'B', tier: '16强强队', comment: '典型硬骨头', tags: ['体系成熟', '稳定输出'] },
  { rank: 18, team: '塞内加尔', group: 'I', tier: '16强强队', comment: '非洲顶级身体与转换能力', tags: ['非洲力量', '反击犀利'] },
  { rank: 19, team: '厄瓜多尔', group: 'E', tier: '16强边缘强队', comment: '年轻黄金一代', tags: ['防守强度', '高原体系'] },
  { rank: 20, team: '挪威', group: 'I', tier: '高上限黑马', comment: '哈兰德+厄德高带来爆点', tags: ['哈兰德核心', '直接进攻'] },
  { rank: 21, team: '土耳其', group: 'D', tier: '中上游黑马', comment: '居莱尔领衔，技术天赋高', tags: ['技术中场', '情绪波动'] },
  { rank: 22, team: '奥地利', group: 'J', tier: '中上游黑马', comment: '整体压迫和执行力好', tags: ['高位压迫', '纪律严密'] },
  { rank: 23, team: '韩国', group: 'A', tier: '中上游', comment: '首战逆转捷克', tags: ['快速转换', '团队纪律'] },
  { rank: 24, team: '加拿大', group: 'B', tier: '中上游', comment: '主场、速度和身体优势明显', tags: ['边路冲击', '主场加成'] },
  { rank: 25, team: '瑞典', group: 'F', tier: '中游', comment: '锋线有冲击力', tags: ['双锋冲击', '高空优势'] },
  { rank: 26, team: '伊朗', group: 'G', tier: '中游', comment: '亚洲老牌强队', tags: ['身体硬度', '防守稳定'] },
  { rank: 27, team: '科特迪瓦', group: 'E', tier: '中游', comment: '非洲杯冠军底气强', tags: ['身体天赋', '边路冲击'] },
  { rank: 28, team: '阿尔及利亚', group: 'J', tier: '中游', comment: '进攻配置不错', tags: ['边路突破', '技术反击'] },
  { rank: 29, team: '埃及', group: 'G', tier: '中游', comment: '萨拉赫决定上限', tags: ['萨拉赫核心', '反击依赖'] },
  { rank: 30, team: '捷克', group: 'A', tier: '中游偏下', comment: '身体和定位球强', tags: ['高空优势', '中欧硬度'] },
  { rank: 31, team: '巴拉圭', group: 'D', tier: '中游偏下', comment: '防守韧性本是卖点', tags: ['南美硬度', '低位防守'] },
  { rank: 32, team: '澳大利亚', group: 'D', tier: '中游偏下', comment: '纪律性强、抗压好', tags: ['身体对抗', '长传冲击'] },
  { rank: 33, team: '苏格兰', group: 'C', tier: '中游偏下', comment: '英超/意甲球员不少', tags: ['对抗强硬', '定位球强'] },
  { rank: 34, team: '加纳', group: 'L', tier: '中游偏下', comment: '天赋不差', tags: ['冲击速度', '起伏较大'] },
  { rank: 35, team: '突尼斯', group: 'F', tier: '中游偏下', comment: '防守组织可以', tags: ['防守纪律', '小球属性'] },
  { rank: 36, team: '波黑', group: 'B', tier: '下半区较强', comment: '首战逼平加拿大', tags: ['中场技术', '节奏偏慢'] },
  { rank: 37, team: '沙特阿拉伯', group: 'H', tier: '下半区', comment: '熟悉大赛', tags: ['快速反击', '防线压力'] },
  { rank: 38, team: '卡塔尔', group: 'B', tier: '下半区', comment: '亚洲杯冠军有体系', tags: ['控球耐心', '防守隐患'] },
  { rank: 39, team: '约旦', group: 'J', tier: '下半区', comment: '亚洲杯亚军带来信心', tags: ['防守韧性', '经验劣势'] },
  { rank: 40, team: '巴拿马', group: 'L', tier: '下半区', comment: '身体对抗不错', tags: ['防守强硬', '反击有限'] },
  { rank: 41, team: '新西兰', group: 'G', tier: '下半区', comment: '克里斯·伍德是支点', tags: ['高空球', '节奏偏慢'] },
  { rank: 42, team: '伊拉克', group: 'I', tier: '下半区', comment: '能逼平西班牙热身赛值得尊重', tags: ['团队韧性', '防守反击'] },
  { rank: 43, team: '刚果民主共和国', group: 'K', tier: '下半区', comment: '对抗和个体能力有', tags: ['身体冲击', '防守不稳'] },
  { rank: 44, team: '乌兹别克斯坦', group: 'K', tier: '下半区', comment: '青训和防线潜力好', tags: ['中亚新军', '防守紧凑'] },
  { rank: 45, team: '南非', group: 'A', tier: '下半区', comment: '首战0-2墨西哥', tags: ['速度反击', '防线韧性'] },
  { rank: 46, team: '佛得角', group: 'H', tier: '下半区', comment: '励志黑马', tags: ['黑马潜质', '身体速度'] },
  { rank: 47, team: '库拉索', group: 'E', tier: '下半区', comment: '有个别欧洲联赛球员', tags: ['黑马故事', '低位反击'] },
  { rank: 48, team: '海地', group: 'C', tier: '下半区', comment: '冲击力有', tags: ['身体冲击', '经验不足'] },
];

export function getTeamRank(teamName: string): number | null {
  const found = WORLD_CUP_RANKINGS.find(r => r.team === teamName);
  return found ? found.rank : null;
}

export const TIER_COLORS: Record<string, string> = {
  '争冠一档': 'text-red-500 bg-red-50',
  '争冠/四强档': 'text-orange-500 bg-orange-50',
  '深度黑马': 'text-amber-600 bg-amber-50',
  '深度淘汰赛档': 'text-yellow-600 bg-yellow-50',
  '16强强队': 'text-blue-400 bg-blue-50',
  '16强边缘强队': 'text-sky-500 bg-sky-50',
  '高上限黑马': 'text-purple-500 bg-purple-50',
  '中上游黑马': 'text-purple-400 bg-purple-50',
  '中上游': 'text-gray-600 bg-gray-100',
  '中游': 'text-gray-500 bg-gray-100',
  '中游偏下': 'text-gray-400 bg-gray-50',
  '下半区较强': 'text-gray-400 bg-gray-50',
  '下半区': 'text-gray-300 bg-gray-50',
};
