import type {
  CustomerDef,
  DayConfig,
  DayTheme,
  DrinkDef,
  FinishMode,
  FlavorType,
  IceType,
  MilkType,
  ProductCategory,
  Recipe,
  SizeType,
  SugarType,
  TeaBase,
  ToppingType,
  UpgradeDef,
  UpgradeId,
} from './types';

export interface IngredientMeta {
  id: string;
  label: string;
  sub: string;
  color: string;
  color2?: string;
  icon: string;
}

export const TEAS: IngredientMeta[] = [
  { id: 'assam', label: '阿萨姆红茶', sub: '醇厚回甘', color: '#b96b50', color2: '#e2a17f', icon: 'tea-assam' },
  { id: 'jasmine', label: '茉莉绿茶', sub: '清花香', color: '#a7c97d', color2: '#d7e8b8', icon: 'tea-jasmine' },
  { id: 'oolong', label: '炭焙乌龙', sub: '焙火香气', color: '#c79355', color2: '#ecd0a2', icon: 'tea-oolong' },
  { id: 'matcha', label: '宇治抹茶', sub: '青涩微苦', color: '#8db56f', color2: '#c7dfae', icon: 'tea-matcha' },
  { id: 'none', label: '不加茶底', sub: '纯粹奶香', color: '#e4eef0', color2: '#f7fbfb', icon: 'tea-none' },
];

export const MILKS: IngredientMeta[] = [
  { id: 'fresh', label: '牧场鲜奶', sub: '丝滑浓郁', color: '#fff8ec', color2: '#eedcc5', icon: 'milk-fresh' },
  { id: 'coconut', label: '生椰乳', sub: '清甜椰香', color: '#f4f0e3', color2: '#dfd7c1', icon: 'milk-coconut' },
  { id: 'none', label: '不加奶', sub: '喝茶本味', color: '#d8e9dd', color2: '#f5fbf7', icon: 'milk-none' },
];

export const FLAVORS: IngredientMeta[] = [
  { id: 'peach', label: '蜜桃果酱', sub: '粉粉甜香', color: '#ffb29f', color2: '#ffd8c8', icon: 'flavor-peach' },
  { id: 'strawberry', label: '草莓果酱', sub: '酸甜莓莓', color: '#ff8ea7', color2: '#ffc7d3', icon: 'flavor-strawberry' },
  { id: 'brownsugar', label: '手熬黑糖', sub: '焦香浓甜', color: '#a96e49', color2: '#d7a37a', icon: 'flavor-brownsugar' },
  { id: 'osmanthus', label: '桂花蜜', sub: '秋天的小花', color: '#e8bd54', color2: '#f7e29c', icon: 'flavor-osmanthus' },
  { id: 'none', label: '原味', sub: '不加果酱', color: '#eee4d4', color2: '#faf5eb', icon: 'flavor-none' },
];

export const TOPPINGS: IngredientMeta[] = [
  { id: 'pearl', label: '黑糖珍珠', sub: 'QQ 弹弹', color: '#5f4235', color2: '#916b56', icon: 'top-pearl' },
  { id: 'jelly', label: '白玉椰果', sub: '脆脆清甜', color: '#f4e9d2', color2: '#fff9e9', icon: 'top-jelly' },
  { id: 'taro', label: '手捣芋泥', sub: '绵密香芋', color: '#c5a3d9', color2: '#e7d4f0', icon: 'top-taro' },
  { id: 'cheese', label: '芝士奶盖', sub: '咸甜云朵', color: '#fff1d8', color2: '#ffd9a6', icon: 'top-cheese' },
  { id: 'none', label: '不加小料', sub: '清清爽爽', color: '#dcd6cb', color2: '#f3efe7', icon: 'top-none' },
];

export const ICES: IngredientMeta[] = [
  { id: 'hot', label: '热饮', sub: '暖暖的', color: '#ffb9a1', color2: '#ffe3d4', icon: 'ice-hot' },
  { id: 'less', label: '少冰', sub: '三分冰', color: '#b9e3ea', color2: '#e4f7fa', icon: 'ice-less' },
  { id: 'normal', label: '正常冰', sub: '清爽满杯', color: '#8dd5e3', color2: '#d6f3f9', icon: 'ice-normal' },
];

export const SUGARS: IngredientMeta[] = [
  { id: 'zero', label: '无糖', sub: '只听茶香', color: '#d6e9dd', color2: '#eff8f1', icon: 'sugar-zero' },
  { id: 'half', label: '半糖', sub: '刚刚好的甜', color: '#ffd9af', color2: '#ffefd6', icon: 'sugar-half' },
  { id: 'full', label: '全糖', sub: '甜度满格', color: '#ffc0c9', color2: '#ffe3e8', icon: 'sugar-full' },
];

export const SIZES: IngredientMeta[] = [
  { id: 'medium', label: '中杯', sub: '刚刚好', color: '#ffd2df', color2: '#fff0f5', icon: 'size-medium' },
  { id: 'large', label: '大杯', sub: '快乐加倍', color: '#aeead8', color2: '#e4fbf3', icon: 'size-large' },
];

export const TEAS_MAP = Object.fromEntries(TEAS.map((x) => [x.id, x])) as Record<TeaBase, IngredientMeta>;
export const MILKS_MAP = Object.fromEntries(MILKS.map((x) => [x.id, x])) as Record<MilkType, IngredientMeta>;
export const FLAVORS_MAP = Object.fromEntries(FLAVORS.map((x) => [x.id, x])) as Record<FlavorType, IngredientMeta>;
export const TOPPINGS_MAP = Object.fromEntries(TOPPINGS.map((x) => [x.id, x])) as Record<ToppingType, IngredientMeta>;
export const ICES_MAP = Object.fromEntries(ICES.map((x) => [x.id, x])) as Record<IceType, IngredientMeta>;
export const SUGARS_MAP = Object.fromEntries(SUGARS.map((x) => [x.id, x])) as Record<SugarType, IngredientMeta>;
export const SIZES_MAP = Object.fromEntries(SIZES.map((x) => [x.id, x])) as Record<SizeType, IngredientMeta>;

export interface CategoryMeta {
  label: string;
  latin: string;
  icon: string;
  color: string;
  finishLabel: string;
  finishLatin: string;
  finishVerb: string;
  qualityLabel: string;
}

export const CATEGORY_META: Record<ProductCategory, CategoryMeta> = {
  tea: {
    label: '茶饮',
    latin: 'TEA',
    icon: 'cup',
    color: '#ff9fbe',
    finishLabel: '手摇',
    finishLatin: 'SHAKE',
    finishVerb: '摇一摇',
    qualityLabel: '手摇品质',
  },
  milkshake: {
    label: '奶昔',
    latin: 'SHAKE',
    icon: 'milkshake',
    color: '#ffd06f',
    finishLabel: '搅拌',
    finishLatin: 'BLEND',
    finishVerb: '开搅拌',
    qualityLabel: '搅拌品质',
  },
  icecream: {
    label: '冰淇淋',
    latin: 'GELATO',
    icon: 'icecream',
    color: '#9fe3cf',
    finishLabel: '堆球',
    finishLatin: 'SCOOP',
    finishVerb: '准备堆球',
    qualityLabel: '造型品质',
  },
};

export const FINISH_META: Record<FinishMode, { icon: string; button: string; hint: string; scale: [string, string, string] }> = {
  shake: { icon: 'shaker', button: '摇！', hint: '指针进入薄荷色区域时摇一下，共三次。', scale: ['太轻', '刚刚好', '太重'] },
  blend: { icon: 'milkshake', button: '停！', hint: '搅拌刻度经过薄荷区时按下，共两次。', scale: ['太稀', '刚刚好', '太稠'] },
  scoop: { icon: 'icecream', button: '放！', hint: '舀球落点进入中心时放下，共三球。', scale: ['偏左', '刚刚好', '偏右'] },
};

export interface PackagingMeta {
  id: string;
  label: string;
  sub: string;
  icon: string;
  color: string;
}

export const PACKAGING_META: Record<string, PackagingMeta> = {
  seal: { id: 'seal', label: '封口膜', sub: '先盖紧，别洒出来', icon: 'seal', color: '#ff9fbe' },
  straw: { id: 'straw', label: '吸管', sub: '单独装进纸套', icon: 'straw', color: '#8fd9c1' },
  bag: { id: 'bag', label: '保温袋', sub: '最后放进提袋', icon: 'delivery', color: '#a8b6ea' },
  sleeve: { id: 'sleeve', label: '隔热杯套', sub: '奶昔要端稳', icon: 'thermo', color: '#ffd06f' },
  guard: { id: 'guard', label: '防融盖', sub: '冰淇淋怕热', icon: 'icecream', color: '#ffb08c' },
  spoon: { id: 'spoon', label: '小勺', sub: '记得配一把', icon: 'spoon', color: '#c9a7dc' },
};

export const PACKAGING_BY_CATEGORY: Record<ProductCategory, string[]> = {
  tea: ['seal', 'straw', 'bag'],
  milkshake: ['seal', 'sleeve', 'bag'],
  icecream: ['guard', 'spoon', 'bag'],
};

export const DELIVERY_ADDRESSES = [
  '棉花糖公寓 3F',
  '薄荷街 17 号',
  '落日放映室',
  '云朵图书馆',
  '小熊面包房',
  '晚风公园长椅',
  '星灯公寓 802',
  '桃子唱片店',
  '蓝莓花店后门',
  '橘子汽水杂货铺',
];

export const DELIVERY_NOTES = [
  '麻烦少冰，谢谢！',
  '不用打电话，放门口就好～',
  '骑手辛苦了，慢慢来。',
  '吸管请单独装，谢谢！',
  '今天想喝甜一点。',
  '给加班的自己点的。',
  '杯套多套一层可以吗？',
  '如果洒了也没关系，安全第一。',
];

export const REGULAR_WISHES = [
  '今天想喝到你记得的那杯。',
  '想尝尝你新调的味道。',
  '今天有点累，想要甜甜的。',
  '还是老样子，拜托啦。',
  '想喝一杯有阳光味道的。',
];

export function categoryOf(drink: DrinkDef | undefined): ProductCategory {
  return drink?.category ?? 'tea';
}

export function finishOf(drink: DrinkDef | undefined): FinishMode {
  return drink?.finish ?? 'shake';
}

export function iceLabelFor(category: ProductCategory, ice: IceType): string {
  if (category === 'tea') return ICES_MAP[ice].label;
  if (category === 'milkshake') {
    return { hot: '热打', less: '绵密', normal: '冰爽' }[ice];
  }
  return { hot: '软心', less: '微冻', normal: '冰爽' }[ice];
}

export function recipeValueLabelFor(category: ProductCategory, key: keyof Recipe, value: string): string {
  if (key === 'ice') return iceLabelFor(category, value as IceType);
  return recipeValueLabel(key, value);
}

export function baseRecipeLineFor(category: ProductCategory, recipe: Recipe): string {
  if (category === 'milkshake') {
    return [TEAS_MAP[recipe.tea].label, MILKS_MAP[recipe.milk].label, FLAVORS_MAP[recipe.flavor].label].join(' · ');
  }
  if (category === 'icecream') {
    return [FLAVORS_MAP[recipe.flavor].label, MILKS_MAP[recipe.milk].label, TOPPINGS_MAP[recipe.topping].label].join(' · ');
  }
  return baseRecipeLine(recipe);
}

export const DRINKS: DrinkDef[] = [
  {
    id: 'black_sugar',
    name: '黑糖珍珠鲜奶',
    latin: 'BROWN SUGAR BOBA',
    tagline: '虎纹挂壁，珍珠在杯底打个滚。',
    price: 27,
    color: '#e7c39e',
    colorTop: '#f4e4cd',
    accent: '#6a4433',
    unlockDay: 1,
    badge: '招牌',
    category: 'tea',
    finish: 'shake',
    recipe: { tea: 'none', milk: 'fresh', flavor: 'brownsugar', topping: 'pearl', ice: 'normal', sugar: 'full', size: 'medium' },
  },
  {
    id: 'peach_oolong',
    name: '蜜桃乌龙冰茶',
    latin: 'PEACH OOLONG',
    tagline: '一颗水蜜桃，住进清凉乌龙里。',
    price: 24,
    color: '#ff9f88',
    colorTop: '#ffc9ad',
    accent: '#ffd16f',
    unlockDay: 1,
    badge: '人气',
    category: 'tea',
    finish: 'shake',
    recipe: { tea: 'oolong', milk: 'none', flavor: 'peach', topping: 'none', ice: 'less', sugar: 'half', size: 'medium' },
  },
  {
    id: 'strawberry_bobo',
    name: '草莓啵啵乳',
    latin: 'BERRY BOBO',
    tagline: '粉红果肉和啵啵在杯里开派对。',
    price: 29,
    color: '#ffb0c3',
    colorTop: '#ffe2e8',
    accent: '#de5b78',
    unlockDay: 1,
    category: 'tea',
    finish: 'shake',
    recipe: { tea: 'jasmine', milk: 'fresh', flavor: 'strawberry', topping: 'pearl', ice: 'less', sugar: 'half', size: 'medium' },
  },
  {
    id: 'matcha_coco',
    name: '抹茶生椰',
    latin: 'MATCHA COCO',
    tagline: '青绿抹茶色和白云一样的生椰乳。',
    price: 30,
    color: '#b9d5a3',
    colorTop: '#eef5de',
    accent: '#6e9a60',
    unlockDay: 1,
    category: 'tea',
    finish: 'shake',
    recipe: { tea: 'matcha', milk: 'coconut', flavor: 'none', topping: 'jelly', ice: 'normal', sugar: 'half', size: 'medium' },
  },
  {
    id: 'osmanthus_milk',
    name: '桂花奶绿',
    latin: 'OSMANTHUS LATTE',
    tagline: '秋日小巷里的桂花香，装进温热杯。',
    price: 26,
    color: '#d6dfa0',
    colorTop: '#f5ecc2',
    accent: '#d5aa44',
    unlockDay: 2,
    category: 'tea',
    finish: 'shake',
    recipe: { tea: 'jasmine', milk: 'fresh', flavor: 'osmanthus', topping: 'none', ice: 'hot', sugar: 'half', size: 'medium' },
  },
  {
    id: 'taro_milk',
    name: '芋泥波波奶茶',
    latin: 'TARO BOBA',
    tagline: '一勺绵密芋泥，软到心里去。',
    price: 32,
    color: '#c7a5d6',
    colorTop: '#eadcf0',
    accent: '#8b6c9b',
    unlockDay: 3,
    category: 'tea',
    finish: 'shake',
    recipe: { tea: 'assam', milk: 'fresh', flavor: 'none', topping: 'taro', ice: 'normal', sugar: 'half', size: 'large' },
  },
  {
    id: 'coconut_jelly',
    name: '生椰黑糖冻',
    latin: 'COCONUT JELLY',
    tagline: '生椰的清爽，撞上黑糖的浓郁。',
    price: 29,
    color: '#dec19d',
    colorTop: '#f5ead9',
    accent: '#7db6a0',
    unlockDay: 4,
    category: 'tea',
    finish: 'shake',
    recipe: { tea: 'none', milk: 'coconut', flavor: 'brownsugar', topping: 'jelly', ice: 'normal', sugar: 'half', size: 'medium' },
  },
  {
    id: 'matcha_berry',
    name: '抹茶莓莓奶盖',
    latin: 'MATCHA BERRY',
    tagline: '苦抹茶、酸莓果、咸奶盖的三角关系。',
    price: 33,
    color: '#aacb92',
    colorTop: '#fff2dd',
    accent: '#df6e8b',
    unlockDay: 5,
    badge: '季节',
    category: 'tea',
    finish: 'shake',
    recipe: { tea: 'matcha', milk: 'none', flavor: 'strawberry', topping: 'cheese', ice: 'less', sugar: 'half', size: 'medium' },
  },
  {
    id: 'peach_taro',
    name: '白桃芋泥奶绿',
    latin: 'PEACH TARO',
    tagline: '桃气少女的梦幻分层，摇匀前先拍照。',
    price: 34,
    color: '#f3b8c6',
    colorTop: '#e7d7ee',
    accent: '#b891cb',
    unlockDay: 6,
    category: 'tea',
    finish: 'shake',
    recipe: { tea: 'jasmine', milk: 'fresh', flavor: 'peach', topping: 'taro', ice: 'normal', sugar: 'half', size: 'large' },
  },
  {
    id: 'strawberry_shake',
    name: '草莓云朵奶昔',
    latin: 'BERRY CLOUD',
    tagline: '粉红奶昔顶着云朵奶油，吸管一插就开心。',
    price: 30,
    color: '#ffb3c9',
    colorTop: '#fff2ee',
    accent: '#e17397',
    unlockDay: 1,
    badge: '新品',
    category: 'milkshake',
    finish: 'blend',
    recipe: { tea: 'jasmine', milk: 'fresh', flavor: 'strawberry', topping: 'cheese', ice: 'less', sugar: 'half', size: 'medium' },
  },
  {
    id: 'peach_softserve',
    name: '蜜桃软冰淇淋',
    latin: 'PEACH SOFT',
    tagline: '软绵绵的桃味冰淇淋，淋一点蜂蜜小珍珠。',
    price: 26,
    color: '#ffc8a8',
    colorTop: '#fff4de',
    accent: '#ff8f74',
    unlockDay: 1,
    badge: '新品',
    category: 'icecream',
    finish: 'scoop',
    recipe: { tea: 'none', milk: 'fresh', flavor: 'peach', topping: 'jelly', ice: 'normal', sugar: 'half', size: 'medium' },
  },
  {
    id: 'taro_shake',
    name: '芋泥厚奶昔',
    latin: 'TARO DREAM',
    tagline: '一勺芋泥沉进奶昔里，紫紫的，软软的。',
    price: 33,
    color: '#cbb0e2',
    colorTop: '#f3eafb',
    accent: '#8b6bae',
    unlockDay: 3,
    badge: '新品',
    category: 'milkshake',
    finish: 'blend',
    recipe: { tea: 'assam', milk: 'fresh', flavor: 'none', topping: 'taro', ice: 'less', sugar: 'half', size: 'large' },
  },
  {
    id: 'matcha_cone',
    name: '抹茶脆筒',
    latin: 'MATCHA CONE',
    tagline: '脆脆的筒，苦苦的茶，和一朵咸咸的奶盖云。',
    price: 28,
    color: '#a9cc8d',
    colorTop: '#fff1d7',
    accent: '#5f8a54',
    unlockDay: 4,
    category: 'icecream',
    finish: 'scoop',
    recipe: { tea: 'matcha', milk: 'none', flavor: 'none', topping: 'cheese', ice: 'less', sugar: 'half', size: 'medium' },
  },
  {
    id: 'brownsugar_icecream',
    name: '黑糖珍珠冰淇淋',
    latin: 'BOBA GELATO',
    tagline: '黑糖像小河的纹路，珍珠藏在每一口里。',
    price: 30,
    color: '#e4c19a',
    colorTop: '#fff2e0',
    accent: '#7d5138',
    unlockDay: 6,
    category: 'icecream',
    finish: 'scoop',
    recipe: { tea: 'none', milk: 'fresh', flavor: 'brownsugar', topping: 'pearl', ice: 'normal', sugar: 'full', size: 'medium' },
  },
];

export const DRINKS_MAP = Object.fromEntries(DRINKS.map((d) => [d.id, d])) as Record<string, DrinkDef>;

export const CUSTOMERS: CustomerDef[] = [
  {
    id: 'momo',
    name: '桃桃',
    latin: 'MOMO',
    title: '甜品杂志编辑',
    species: 'fox',
    hairStyle: 'twintails',
    accessory: 'star',
    quote: '今天的桃桃，也要甜甜的！',
    chat: {
      line: '今天的桃桃，也要甜甜的！店长，你开店多久啦？',
      options: [
        { label: '刚开不久，请多关照。', reply: '那我要当你的第一位常客！给你一颗桃心。' },
        { label: '为一杯好奶茶，慢慢学。', reply: '认真的人做出来的奶茶，一定很好喝！' },
        { label: '秘密，先尝尝今天的桃桃？', reply: '哈哈，那我用味蕾来调查！' },
      ],
    },
    lines: {
      perfect: '哇！就是这个味道！我要写进下一期杂志！',
      good: '嗯嗯，好喝～不过好像少了一点点什么？',
      bad: '唔…和我记忆里的味道不太一样呢。',
      angry: '等太久啦…下次再见到我的时候，要快一点哦。',
      leaving: '拜拜～明天还来！',
    },
    colors: {
      hair: '#f7a9c4',
      hairShade: '#e78baa',
      earInner: '#ffdbe6',
      skin: '#ffe9dc',
      coat: '#fff7ea',
      coatShade: '#f0ddc9',
      accent: '#8fe0c4',
      eyes: '#c76184',
    },
    minDay: 1,
  },
  {
    id: 'kuri',
    name: '栗子',
    latin: 'KURI',
    title: '街角面包房学徒',
    species: 'bear',
    hairStyle: 'short',
    accessory: 'beret',
    quote: '刚出炉的面包香，和奶茶很配吧？',
    chat: {
      line: '今天烤了好多面包，好累呀。可以给我一杯甜甜的、暖暖的吗？',
      options: [
        { label: '今天的订单，我记牢啦。', reply: '嗯！交给你我最放心。' },
        { label: '面包香不香？改天教我做。', reply: '香！下次带刚出炉的给你！' },
        { label: '先喝杯奶茶，休息一下。', reply: '嗯…被奶茶治愈了。' },
      ],
    },
    lines: {
      perfect: '好幸福！像刚出炉的面包一样幸福！',
      good: '好喝！喝完又有力气揉面团了。',
      bad: '咦？这杯喝起来有点陌生。',
      angry: '呜…我的奶茶先去梦里了。',
      leaving: '谢谢你～我去烤面包啦。',
    },
    colors: {
      hair: '#b7805f',
      hairShade: '#996448',
      earInner: '#e7bea2',
      skin: '#ffe7d7',
      coat: '#f8efdc',
      coatShade: '#e5d3b8',
      accent: '#83d6b8',
      eyes: '#6f4e38',
    },
    minDay: 1,
  },
  {
    id: 'yuzu',
    name: '小柚',
    latin: 'YUZU',
    title: '放学路上的常客',
    species: 'cat',
    hairStyle: 'bob',
    accessory: 'ribbon',
    quote: '放学后的第一杯，要粉粉的！',
    chat: {
      line: '放学后的第一杯！可是今天数学考得不好…',
      options: [
        { label: '那就喝点甜的，奖励自己。', reply: '好！甜的可以打败数学题！' },
        { label: '下次考好，我请你喝。', reply: '一言为定！我会努力！' },
        { label: '要不要加一份小料？', reply: '要要要！小料是治愈魔法！' },
      ],
    },
    lines: {
      perfect: '满分！今天的快乐已经充值成功！',
      good: '还不错嘛，下次要不要试试加料？',
      bad: '诶？我点的好像不是这个味道…',
      angry: '作业还没写完，我先回家啦。',
      leaving: '明天见！要给我留草莓哦！',
    },
    colors: {
      hair: '#93dcbd',
      hairShade: '#6cc3a1',
      earInner: '#ffe4d4',
      skin: '#ffe9dd',
      coat: '#ffe6ee',
      coatShade: '#f3c6d3',
      accent: '#ffc35d',
      eyes: '#4e9e81',
    },
    minDay: 1,
  },
  {
    id: 'tsukimi',
    name: '月见',
    latin: 'TSUKIMI',
    title: '夜间图书馆管理员',
    species: 'rabbit',
    hairStyle: 'long',
    accessory: 'clip',
    quote: '一杯温热的，慢慢喝。',
    chat: {
      line: '今晚图书馆闭馆晚，想带一杯回去。',
      options: [
        { label: '温热的，慢慢喝。', reply: '谢谢。你总是记得温度。' },
        { label: '加班辛苦了，今晚也加油。', reply: '有这句话，书页都轻了一些。' },
        { label: '月亮很圆，适合早点休息。', reply: '嗯。喝完这杯就回去。' },
      ],
    },
    lines: {
      perfect: '很温柔的味道。今晚可以安心加班了。',
      good: '谢谢，味道不错。温度也刚刚好。',
      bad: '嗯…似乎和平常有一点不同。',
      angry: '夜深了，我先回去了。下次请不要让我等太久。',
      leaving: '晚安。月亮很圆。',
    },
    colors: {
      hair: '#d8c3ee',
      hairShade: '#b9a0da',
      earInner: '#ffd8e2',
      skin: '#fff0e6',
      coat: '#eaf5ef',
      coatShade: '#cbe3d9',
      accent: '#ffadc7',
      eyes: '#8b70c0',
    },
    minDay: 2,
  },
  {
    id: 'usui',
    name: '薄雾',
    latin: 'USUI',
    title: '独立游戏设计师',
    species: 'wolf',
    hairStyle: 'fluffy',
    accessory: 'scarf',
    quote: '糖少一点，灵感多一点。',
    chat: {
      line: '在调一个新的数值，糖度也想试试新参数。',
      options: [
        { label: '要不要试试半糖？', reply: '半糖…好，变量少一点，灵感多一点。' },
        { label: '灵感比配方更重要。', reply: '说得好。这杯算我的灵感来源。' },
        { label: '先把这一杯喝好，再调游戏。', reply: '合理。现实版本的更新也很重要。' },
      ],
    },
    lines: {
      perfect: '完美参数。这杯可以进我的游戏里。',
      good: '不错，接近理想值了。',
      bad: '嗯…变量好像填错了。',
      angry: '等待加载太久了，我先下线。',
      leaving: '下次见，希望版本更新快一点。',
    },
    colors: {
      hair: '#cdd5e7',
      hairShade: '#a9b3cb',
      earInner: '#f1dbe2',
      skin: '#fbe9df',
      coat: '#dcf1e9',
      coatShade: '#bcdcd0',
      accent: '#f5a7c1',
      eyes: '#687c9f',
    },
    minDay: 2,
  },
  {
    id: 'alan',
    name: '阿岚',
    latin: 'ALAN',
    title: '跑遍全城的配送员',
    species: 'dog',
    hairStyle: 'ponytail',
    accessory: 'glasses',
    quote: '赶时间，正常冰就好！',
    chat: {
      line: '刚送完一单，赶时间，但想喝口冰的。',
      options: [
        { label: '正常冰，马上给你！', reply: '够爽快！这一单我也给你五星！' },
        { label: '慢一点也没关系。', reply: '不行不行，习惯了快。不过谢谢你。' },
        { label: '路上注意安全。', reply: '收到！安全第一，奶茶第二。' },
      ],
    },
    lines: {
      perfect: '够快够准！这一单五星好评！',
      good: '谢啦，差一点点就完美了。',
      bad: '呃，送错单的话我要被扣钱了。',
      angry: '超时了超时了，我先撤！',
      leaving: '下个路口见！',
    },
    colors: {
      hair: '#7a93ae',
      hairShade: '#5c7490',
      earInner: '#e9ccbf',
      skin: '#ffe9d8',
      coat: '#fbe8de',
      coatShade: '#eccdbd',
      accent: '#85d4c0',
      eyes: '#506b8b',
    },
    minDay: 3,
  },
  {
    id: 'rin',
    name: '凛',
    latin: 'RIN',
    title: '神秘的美食评论家',
    species: 'cat',
    hairStyle: 'long',
    accessory: 'clip',
    quote: '让我看看，这家小店真正的实力。',
    chat: {
      line: '让我看看，这家小店真正的实力。',
      options: [
        { label: '请多指教，我会认真做好每一杯。', reply: '态度不错。味道，我会如实写。' },
        { label: '今天的配方，值得期待。', reply: '哦？那我可要仔细尝尝。' },
        { label: '如果你愿意，也可以常来。', reply: '……看你的表现。' },
      ],
    },
    lines: {
      perfect: '无可挑剔。你会出现在我的专栏里。',
      good: '尚可。不过距离「惊艳」还差一步。',
      bad: '配方和订单，似乎有一处对不上。',
      angry: '连客人的耐心都照顾不好，谈何味道。',
      leaving: '期待下一次见面。',
    },
    colors: {
      hair: '#6e5b82',
      hairShade: '#524266',
      earInner: '#e8c7d1',
      skin: '#ffeadf',
      coat: '#39435c',
      coatShade: '#2a3349',
      accent: '#ffd17d',
      eyes: '#eec04f',
    },
    minDay: 3,
    vip: true,
  },
];

export const CUSTOMERS_MAP = Object.fromEntries(CUSTOMERS.map((c) => [c.id, c])) as Record<string, CustomerDef>;

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'seat',
    name: '软软坐垫',
    latin: 'SOFT STOOL',
    description: '给等待加一点柔软。',
    flavor: '坐垫上绣着一只打盹的小猫。',
    maxLevel: 3,
    costs: [80, 150, 240],
    accent: '#ffaac6',
  },
  {
    id: 'sign',
    name: '招财桃牌',
    latin: 'LUCKY PEACH',
    description: '灯牌一亮，好运就来了。',
    flavor: '据说摸摸它，小费会变多。',
    maxLevel: 3,
    costs: [100, 180, 280],
    accent: '#ffd06f',
  },
  {
    id: 'display',
    name: '奶油甜品柜',
    latin: 'CREAM DISPLAY',
    description: '蛋糕和奶茶是天生一对。',
    flavor: '每天只做六块，总是卖光。',
    maxLevel: 3,
    costs: [120, 210, 320],
    accent: '#9ee5ca',
  },
  {
    id: 'training',
    name: '手摇特训',
    latin: 'SHAKE CLASS',
    description: '跟着节拍，摇出云朵般的奶泡。',
    flavor: '店主偷偷练习了三百次。',
    maxLevel: 2,
    costs: [90, 160],
    accent: '#aacff5',
  },
];

export const UPGRADES_MAP = Object.fromEntries(UPGRADES.map((u) => [u.id, u])) as Record<UpgradeId, UpgradeDef>;

export const THEMES: DayTheme[] = [
  {
    id: 'noon',
    name: '粉桃午后',
    skyTop: '#ffcfdf',
    skyBottom: '#d7f6e9',
    glow: '#fff0c9',
    ambient: '#ffe7d8',
    sun: '#fff0d2',
    fog: '#ffdbe7',
    accent: '#ff93b6',
    hint: '阳光正好，适合喝一杯冰的。',
  },
  {
    id: 'dusk',
    name: '蜜桃黄昏',
    skyTop: '#ffa9c1',
    skyBottom: '#ffe0b2',
    glow: '#ffc58e',
    ambient: '#ffd6c6',
    sun: '#ffae7d',
    fog: '#f8c3c2',
    accent: '#ff789e',
    hint: '晚霞把店里染成了蜜桃色。',
  },
  {
    id: 'night',
    name: '星灯夜话',
    skyTop: '#3b3d63',
    skyBottom: '#a07e96',
    glow: '#ffd7a3',
    ambient: '#d8dbea',
    sun: '#ffe0b0',
    fog: '#7d6880',
    accent: '#ffc4dd',
    hint: '星星出来了，灯串也亮起来了。',
  },
  {
    id: 'morning',
    name: '薄荷清晨',
    skyTop: '#d7f2ec',
    skyBottom: '#fff0e2',
    glow: '#fff8d9',
    ambient: '#f2fbf5',
    sun: '#fff9e7',
    fog: '#e7f8f1',
    accent: '#71d5b4',
    hint: '露水还没干，第一位客人已经来了。',
  },
  {
    id: 'candy',
    name: '糖果彩虹',
    skyTop: '#ffc4dd',
    skyBottom: '#c9f1e6',
    glow: '#ffe7a6',
    ambient: '#fff0e6',
    sun: '#fff4c6',
    fog: '#f4c9da',
    accent: '#ffb45f',
    hint: '今天的天空像一盒没吃完的水果糖。',
  },
];

export const TUTORIAL_STEPS = [
  {
    title: '先听客人说',
    text: '看到门口的小气泡了吗？点一下客人的气泡，看看 Ta 今天想喝什么。',
    icon: 'bubble',
  },
  {
    title: '写进小本子',
    text: '确认点单后，按下绿色的「记下来」按钮。订单会写进手账，客人也会开始耐心等待。',
    icon: 'notebook',
  },
  {
    title: '照着配方调制',
    text: '客人的要求里只写糖度、冰量和加料。茶底和风味要翻手账里的「配方」页对照哦。',
    icon: 'shaker',
  },
  {
    title: '按品类完成收尾',
    text: '茶饮要手摇，奶昔要搅拌，冰淇淋要堆球。让指针停在薄荷区，越准越香。',
    icon: 'stars',
  },
  {
    title: '外卖记得打包',
    text: '外卖单出现在右侧外卖台。出杯前把封口、吸管和保温袋一一装好，骑手会给出更高评分。',
    icon: 'delivery',
  },
];

export function getDayConfig(day: number): DayConfig {
  const unlocked = DRINKS.filter((d) => d.unlockDay <= day);
  const newDrinks = DRINKS.filter((d) => d.unlockDay === day);
  const theme = THEMES[(day - 1) % THEMES.length];
  return {
    day,
    shiftSeconds: Math.min(205, 155 + (day - 1) * 7),
    goal: 90 + (day - 1) * 70,
    spawnEvery: Math.max(9.5, 15.5 - (day - 1) * 0.9),
    deliveryEvery: day >= 2 ? Math.max(15, 26 - (day - 2) * 1.3) : 0,
    patience: Math.max(42, 63 - (day - 1) * 2),
    vipChance: day >= 3 ? Math.min(0.18, 0.05 + day * 0.012) : 0,
    rushChance: day >= 2 ? Math.min(0.26, 0.07 + day * 0.025) : 0,
    theme,
    unlockedDrinkIds: unlocked.map((d) => d.id),
    newDrinkIds: newDrinks.map((d) => d.id),
  };
}

export function randomRequest(base: Recipe, day: number, category: ProductCategory = 'tea'): Recipe {
  const request: Recipe = { ...base };
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const roll = Math.random();
  const coldOnly = category !== 'tea';

  if (roll < 0.48) {
    request.sugar = pick<SugarType>(['zero', 'half', 'full']);
  }
  if (Math.random() < 0.55) {
    const ices: IceType[] = coldOnly
      ? ['less', 'normal']
      : day >= 2
        ? ['hot', 'less', 'normal']
        : ['less', 'normal'];
    request.ice = pick<IceType>(ices);
  }
  if (Math.random() < 0.42) {
    request.size = pick<SizeType>(['medium', 'large']);
  }
  if (Math.random() < 0.32) {
    request.topping = pick<ToppingType>(['pearl', 'jelly', 'taro', 'cheese', 'none']);
  }
  return request;
}

export function compareRecipe(request: Recipe, made: Recipe): { matches: number; total: number; matched: Record<keyof Recipe, boolean> } {
  const keys: (keyof Recipe)[] = ['tea', 'milk', 'flavor', 'topping', 'ice', 'sugar', 'size'];
  const matched = {} as Record<keyof Recipe, boolean>;
  let matches = 0;
  for (const key of keys) {
    const ok = request[key] === made[key];
    matched[key] = ok;
    if (ok) matches += 1;
  }
  return { matches, total: keys.length, matched };
}

export function requestLabels(request: Recipe): string[] {
  const labels: string[] = [];
  labels.push({ hot: '热饮', less: '少冰', normal: '正常冰' }[request.ice]);
  labels.push({ zero: '无糖', half: '半糖', full: '全糖' }[request.sugar]);
  labels.push({ medium: '中杯', large: '大杯' }[request.size]);
  if (request.topping !== 'none') labels.push(`加${TOPPINGS_MAP[request.topping].label}`);
  return labels;
}

export function customerForDay(day: number, vipChance: number, met: Set<string>): { customer: CustomerDef; vip: boolean } {
  const vipRoll = Math.random();
  const vipPool = CUSTOMERS.filter((c) => c.vip && c.minDay <= day);
  if (vipPool.length && vipRoll < vipChance) {
    return { customer: vipPool[Math.floor(Math.random() * vipPool.length)], vip: true };
  }
  const pool = CUSTOMERS.filter((c) => !c.vip && c.minDay <= day);
  const fresh = pool.filter((c) => !met.has(c.id));
  const all = fresh.length > 0 && Math.random() < 0.55 ? fresh : pool;
  return { customer: all[Math.floor(Math.random() * all.length)], vip: false };
}

export function drinkForDay(day: number): DrinkDef {
  const pool = DRINKS.filter((d) => d.unlockDay <= day);
  const roll = Math.random();
  const newest = pool.filter((d) => d.unlockDay >= day - 1);
  if (newest.length && roll < 0.35) return newest[Math.floor(Math.random() * newest.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

export const UPGRADE_EFFECTS: Record<UpgradeId, (level: number) => string> = {
  seat: (level) => (level === 0 ? '客人耐心 +0%' : `客人耐心 +${level * 10}%`),
  sign: (level) => (level === 0 ? '小费 +0%' : `小费 +${level * 15}%`),
  display: (level) => (level === 0 ? '每杯收入 +0%' : `每杯收入 +${level * 7}%`),
  training: (level) => (level === 0 ? '手摇判定 +0%' : `手摇判定区 +${level * 18}%`),
};

export const RECIPE_FIELDS: { key: keyof Recipe; label: string; latin: string }[] = [
  { key: 'tea', label: '茶底', latin: 'TEA' },
  { key: 'milk', label: '奶', latin: 'MILK' },
  { key: 'flavor', label: '风味', latin: 'FLAVOR' },
  { key: 'topping', label: '小料', latin: 'TOPPING' },
  { key: 'ice', label: '冰量', latin: 'ICE' },
  { key: 'sugar', label: '糖度', latin: 'SUGAR' },
  { key: 'size', label: '杯型', latin: 'SIZE' },
];

export function recipeValueMeta(key: keyof Recipe, value: string): IngredientMeta {
  switch (key) {
    case 'tea':
      return TEAS_MAP[value as TeaBase];
    case 'milk':
      return MILKS_MAP[value as MilkType];
    case 'flavor':
      return FLAVORS_MAP[value as FlavorType];
    case 'topping':
      return TOPPINGS_MAP[value as ToppingType];
    case 'ice':
      return ICES_MAP[value as IceType];
    case 'sugar':
      return SUGARS_MAP[value as SugarType];
    case 'size':
      return SIZES_MAP[value as SizeType];
  }
}

export function recipeValueLabel(key: keyof Recipe, value: string): string {
  return recipeValueMeta(key, value).label;
}

export function baseRecipeLine(recipe: Recipe): string {
  return [TEAS_MAP[recipe.tea].label, MILKS_MAP[recipe.milk].label, FLAVORS_MAP[recipe.flavor].label].join(' · ');
}
