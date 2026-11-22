import type { DecorSlot } from './types';

export interface DecorSlotDef {
  id: DecorSlot;
  label: string;
  latin: string;
  /** What each entry of `DecorDef.colors` paints for this slot. */
  palette: string;
}

export interface DecorDef {
  id: string;
  slot: DecorSlot;
  name: string;
  description: string;
  /** 0 for the slot's default style, which every save owns. */
  cost: number;
  colors: string[];
}

export const DECOR_SLOTS: DecorSlotDef[] = [
  { id: 'counter', label: '柜台漆色', latin: 'COUNTER', palette: '柜身 · 抽屉 · 压条' },
  { id: 'wainscot', label: '墙裙', latin: 'WAINSCOT', palette: '墙裙板 · 竖纹' },
  { id: 'curtain', label: '窗帘', latin: 'CURTAINS', palette: '布料 · 绑带' },
  { id: 'bunting', label: '彩旗', latin: 'BUNTING', palette: '三角旗颜色（循环）' },
  { id: 'rug', label: '地毯', latin: 'RUG', palette: '底色 · 花边' },
];

export const DECOR_ITEMS: DecorDef[] = [
  { id: 'counter-sage', slot: 'counter', name: '鼠尾草绿', description: '开店时刷的第一层漆。', cost: 0, colors: ['#9eae95', '#b6c2a8', '#c7c8a6'] },
  { id: 'counter-peach', slot: 'counter', name: '蜜桃粉', description: '整面柜台像一块桃子软糖。', cost: 120, colors: ['#e3a3ae', '#efc0c6', '#f6d6c8'] },
  { id: 'counter-butter', slot: 'counter', name: '黄油奶黄', description: '暖洋洋的，像刚出炉的吐司边。', cost: 160, colors: ['#dcc189', '#ead5a3', '#f3e6c2'] },
  { id: 'counter-berry', slot: 'counter', name: '蓝莓雾蓝', description: '安静的蓝，衬得每一杯都更亮。', cost: 200, colors: ['#8fa4c6', '#adbfdb', '#c9d4e6'] },

  { id: 'wainscot-sage', slot: 'wainscot', name: '抹茶墙裙', description: '和柜台同一桶漆。', cost: 0, colors: ['#abc0a9', '#c2c9af'] },
  { id: 'wainscot-rose', slot: 'wainscot', name: '玫瑰灰粉', description: '靠墙坐的人会觉得被轻轻抱住。', cost: 80, colors: ['#d6a6b0', '#e6c1c7'] },
  { id: 'wainscot-taro', slot: 'wainscot', name: '香芋紫', description: '芋泥奶茶的颜色，刷了三遍。', cost: 110, colors: ['#b3a0cc', '#cbbddf'] },
  { id: 'wainscot-cocoa', slot: 'wainscot', name: '可可木', description: '旧木头的暖，适合下雨天。', cost: 140, colors: ['#b39070', '#cbae90'] },

  { id: 'curtain-mint', slot: 'curtain', name: '薄荷纱帘', description: '风一吹就鼓起来。', cost: 0, colors: ['#e7f9f2', '#ffb8cb'] },
  { id: 'curtain-lemon', slot: 'curtain', name: '柠檬棉布', description: '午后阳光会透出一点点黄。', cost: 60, colors: ['#fff0b3', '#8fd9c1'] },
  { id: 'curtain-sakura', slot: 'curtain', name: '樱花蕾丝', description: '花边是桃桃一针一针缝的。', cost: 80, colors: ['#ffd6e2', '#f2bf74'] },
  { id: 'curtain-night', slot: 'curtain', name: '星夜绒布', description: '拉上它，店里像一盏小夜灯。', cost: 120, colors: ['#c6d3f0', '#ffd17d'] },

  { id: 'bunting-rainbow', slot: 'bunting', name: '水果糖彩旗', description: '开张那天挂上的。', cost: 0, colors: ['#ff8fb2', '#7fd9bb', '#ffd06e', '#b49ce4', '#84c8e8'] },
  { id: 'bunting-peachmint', slot: 'bunting', name: '桃桃薄荷', description: '小店的招牌配色。', cost: 30, colors: ['#ff9fbe', '#9ee5ca', '#fff0e0'] },
  { id: 'bunting-lemonberry', slot: 'bunting', name: '柠檬蓝莓', description: '夏天的汽水味。', cost: 50, colors: ['#ffd86f', '#8fb4ea', '#fff6d8'] },
  { id: 'bunting-taro', slot: 'bunting', name: '香芋星星', description: '夜里看会更好看。', cost: 70, colors: ['#c3a3e0', '#ffd1e6', '#f7e6ff'] },

  { id: 'rug-oat', slot: 'rug', name: '燕麦长毯', description: '踩上去软软的。', cost: 0, colors: ['#cbb397', '#efe1cf'] },
  { id: 'rug-rose', slot: 'rug', name: '玫瑰花边', description: '边上绣了一圈小玫瑰。', cost: 90, colors: ['#e2a6b2', '#fbe3e7'] },
  { id: 'rug-mint', slot: 'rug', name: '薄荷格纹', description: '清爽得像一杯冰绿茶。', cost: 110, colors: ['#a5d4bf', '#e9f7f0'] },
  { id: 'rug-plum', slot: 'rug', name: '李子绒毯', description: '深一点的颜色，藏得住珍珠渍。', cost: 150, colors: ['#a691c0', '#ece4f6'] },
];

export const DECOR_MAP = Object.fromEntries(DECOR_ITEMS.map((item) => [item.id, item])) as Record<string, DecorDef>;

export const DECOR_DEFAULTS: Record<DecorSlot, string> = {
  counter: 'counter-sage',
  wainscot: 'wainscot-sage',
  curtain: 'curtain-mint',
  bunting: 'bunting-rainbow',
  rug: 'rug-oat',
};

export function decorForSlot(slot: DecorSlot): DecorDef[] {
  return DECOR_ITEMS.filter((item) => item.slot === slot);
}
