import type { Intervention } from '../types';

export const INTERVENTIONS: Intervention[] = [
  {
    type: 'omen',
    label: '降示神諭',
    description:
      '引導隊伍趨向特定選項。啟動後選擇目標選項——該選項在隊伍的商議中將獲得顯著的加成。',
    cost: 1,
    flavorText: '神聖的徵兆：驟起的風聲、突如其來的清明，或是心中響起的低語。',
  },
  {
    type: 'blessing',
    label: '賜予祝福',
    description:
      '強化眾人的意志。隊伍的忠誠度暫時提升，使他們在下一次決策中更為團結一致。',
    cost: 1,
    flavorText: '金色的暖意瀰漫全隊。疑慮退散。羈絆依然堅固。',
  },
  {
    type: 'miracle',
    label: '召喚奇蹟',
    description:
      '重大的神聖行動：大幅治癒所有隊員並降低他們的壓力。消耗2點神力。',
    cost: 2,
    flavorText: '光輝降臨。傷口癒合。痛苦消散。神明現身於此。',
  },
];

export const BLESSINGS = [
  {
    id: 'shielding_light',
    label: '護盾之光',
    description: '隊伍在神聖護盾的庇護下出發，減少首個危險事件造成的體力損失。',
    effect: '首個危險事件：體力傷害降低50%。',
  },
  {
    id: 'healing_grace',
    label: '治癒恩典',
    description: '在探險開始時，米拉的治癒力量獲得超自然的強化。',
    effect: '所有隊員起始體力+15，壓力−10。',
  },
  {
    id: 'guiding_omen',
    label: '引導神諭',
    description: '神明的第一次神諭干預免費使用。',
    effect: '首次使用神諭消耗0點神力。',
  },
] as const;
