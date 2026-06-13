export interface TeamRanking {
  rank: number;
  team: string;
  tier: string;
  comment: string;
}

export const WORLD_CUP_RANKINGS: TeamRanking[] = [
  { rank: 1, team: '西班牙', tier: '争冠一档', comment: '欧洲冠军，体系最成熟，Opta/Fox/赔率长期高位' },
  { rank: 2, team: '法国', tier: '争冠一档', comment: '阵容深度最厚，姆巴佩核心，容错率极高' },
  { rank: 3, team: '阿根廷', tier: '争冠一档', comment: 'FIFA第1，卫冕冠军，但年龄结构略压低上限' },
  { rank: 4, team: '英格兰', tier: '争冠一档', comment: '阵容身价、英超核心密度极强，稳定性仍是疑问' },
  { rank: 5, team: '葡萄牙', tier: '争冠/四强档', comment: '纸面天赋豪华，C罗角色处理决定天花板' },
  { rank: 6, team: '巴西', tier: '争冠/四强档', comment: '个人能力顶级，但近两年稳定性不如传统预期' },
  { rank: 7, team: '哥伦比亚', tier: '深度黑马', comment: '近两年南美竞争力强，路易斯·迪亚斯/中前场质量高' },
  { rank: 8, team: '德国', tier: '深度淘汰赛档', comment: '大赛底蕴强，穆西亚拉领衔，但整体统治力不如巅峰' },
  { rank: 9, team: '荷兰', tier: '深度淘汰赛档', comment: '防线和中场硬度好，进攻上限稍逊前八' },
  { rank: 10, team: '比利时', tier: '深度淘汰赛档', comment: '小组友好，德布劳内仍能决定比赛，但黄金一代尾声' },
  { rank: 11, team: '摩洛哥', tier: '深度淘汰赛档', comment: '2022四强后不再是冷门，防守纪律与边路强' },
  { rank: 12, team: '乌拉圭', tier: '深度淘汰赛档', comment: '巴尔韦德等中场硬度强，对抗强队不怵' },
  { rank: 13, team: '克罗地亚', tier: '深度淘汰赛档', comment: '大赛经验极强，但年龄曲线是风险' },
  { rank: 14, team: '日本', tier: '16强强队', comment: '亚洲最成熟体系之一，技术与压迫质量稳定' },
  { rank: 15, team: '墨西哥', tier: '16强强队', comment: '主场加成大，首战2-0增强信心' },
  { rank: 16, team: '美国', tier: '16强强队', comment: '主场+4-1开局大幅加分，但碰顶级强队仍需验证' },
  { rank: 17, team: '瑞士', tier: '16强强队', comment: '典型硬骨头，淘汰赛经验和结构稳定' },
  { rank: 18, team: '塞内加尔', tier: '16强强队', comment: '非洲顶级身体与转换能力，小组强度很高' },
  { rank: 19, team: '厄瓜多尔', tier: '16强边缘强队', comment: '年轻黄金一代，中后场运动能力突出' },
  { rank: 20, team: '挪威', tier: '高上限黑马', comment: '哈兰德+厄德高带来爆点，但整体大赛经验不足' },
  { rank: 21, team: '土耳其', tier: '中上游黑马', comment: '居莱尔领衔，技术天赋高，波动也大' },
  { rank: 22, team: '奥地利', tier: '中上游黑马', comment: '整体压迫和执行力好，适合制造冷门' },
  { rank: 23, team: '韩国', tier: '中上游', comment: '首战逆转捷克，孙兴慜+金玟哉框架仍有竞争力' },
  { rank: 24, team: '加拿大', tier: '中上游', comment: '主场、速度和身体优势明显，首战平波黑略可惜' },
  { rank: 25, team: '瑞典', tier: '中游', comment: '锋线有冲击力，但预选赛过程并不理想' },
  { rank: 26, team: '伊朗', tier: '中游', comment: '亚洲老牌强队，经验足，小组出线机会现实' },
  { rank: 27, team: '科特迪瓦', tier: '中游', comment: '非洲杯冠军底气强，但世界杯稳定性待检验' },
  { rank: 28, team: '阿尔及利亚', tier: '中游', comment: '进攻配置不错，防线可靠性是短板' },
  { rank: 29, team: '埃及', tier: '中游', comment: '萨拉赫决定上限，整体强度略依赖核心' },
  { rank: 30, team: '捷克', tier: '中游偏下', comment: '身体和定位球强，但首战被韩国逆转扣分' },
  { rank: 31, team: '巴拉圭', tier: '中游偏下', comment: '防守韧性本是卖点，但1-4负美国暴露问题' },
  { rank: 32, team: '澳大利亚', tier: '中游偏下', comment: '纪律性强、抗压好，但缺少顶级球星' },
  { rank: 33, team: '苏格兰', tier: '中游偏下', comment: '英超/意甲球员不少，但大赛进攻效率偏低' },
  { rank: 34, team: '加纳', tier: '中游偏下', comment: '天赋不差，但阵容年轻、稳定性不足' },
  { rank: 35, team: '突尼斯', tier: '中游偏下', comment: '防守组织可以，进攻端上限有限' },
  { rank: 36, team: '波黑', tier: '下半区较强', comment: '首战逼平加拿大，老将经验强，但运动能力一般' },
  { rank: 37, team: '沙特阿拉伯', tier: '下半区', comment: '熟悉大赛，但面对西班牙/乌拉圭压力大' },
  { rank: 38, team: '卡塔尔', tier: '下半区', comment: '亚洲杯冠军有体系，但世界杯强度仍是疑问' },
  { rank: 39, team: '约旦', tier: '下半区', comment: '亚洲杯亚军带来信心，整体硬实力仍有限' },
  { rank: 40, team: '巴拿马', tier: '下半区', comment: '身体对抗不错，但小组很难，进攻质量不足' },
  { rank: 41, team: '新西兰', tier: '下半区', comment: '克里斯·伍德是支点，但整体联赛强度偏低' },
  { rank: 42, team: '伊拉克', tier: '下半区', comment: '能逼平西班牙热身赛值得尊重，但小组太硬' },
  { rank: 43, team: '刚果民主共和国', tier: '下半区', comment: '对抗和个体能力有，但整体组织不稳定' },
  { rank: 44, team: '乌兹别克斯坦', tier: '下半区', comment: '青训和防线潜力好，首次大赛经验不足' },
  { rank: 45, team: '南非', tier: '下半区', comment: '首战0-2墨西哥，抗压和终结都显不足' },
  { rank: 46, team: '佛得角', tier: '下半区', comment: '励志黑马，但阵容厚度有限' },
  { rank: 47, team: '库拉索', tier: '下半区', comment: '有个别欧洲联赛球员，但整体样本和深度最弱之一' },
  { rank: 48, team: '海地', tier: '下半区', comment: '冲击力有，整体实力、阵容深度和小组难度都不利' },
];

export function getTeamRank(teamName: string): number | null {
  const found = WORLD_CUP_RANKINGS.find(r => r.team === teamName);
  return found ? found.rank : null;
}

export const TIER_COLORS: Record<string, string> = {
  '争冠一档': 'text-red-500 bg-red-50',
  '争冠/四强档': 'text-orange-500 bg-orange-50',
  '深度黑马': 'text-amber-600 bg-amber-50',
  '深度淘汰赛档': 'text-blue-500 bg-blue-50',
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