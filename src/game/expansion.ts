import { DRINKS_MAP } from './data';
import type {
  CitySave,
  CitySpotId,
  DrinkDef,
  SupplyId,
  TravelSave,
} from './types';

export const CITY_EVENING_SLOTS = 3;
export const CITY_SUPPLY_LIMIT = 3;
export const TRAVEL_COST_COINS = 60;
export const TRAVEL_COST_SLOTS = 2;

// ───────────────────────────────────────── supplies

export interface SupplyBuff {
  tip?: number;
  patience?: number;
  zone?: number;
  price?: number;
}

export interface SupplyDef {
  id: SupplyId;
  name: string;
  latin: string;
  description: string;
  effectLabel: string;
  shortLabel: string;
  cost: number;
  color: string;
  icon: string;
  buff: SupplyBuff;
}

export const SUPPLIES: SupplyDef[] = [
  {
    id: 'peach_crate',
    name: '蜜桃果箱',
    latin: 'PEACH CRATE',
    description: '阿婆清晨刚挑的水蜜桃，香气能飘过两条街。',
    effectLabel: '次日小费 +12%',
    shortLabel: '小费 +12%',
    cost: 40,
    color: '#ffb0a2',
    icon: 'peach',
    buff: { tip: 0.12 },
  },
  {
    id: 'jasmine_tin',
    name: '茉莉茶罐',
    latin: 'JASMINE TIN',
    description: '窨了三遍的茉莉花茶，客人会愿意多等一会儿。',
    effectLabel: '次日客人耐心 +10%',
    shortLabel: '耐心 +10%',
    cost: 35,
    color: '#a9d89a',
    icon: 'tea-jasmine',
    buff: { patience: 0.1 },
  },
  {
    id: 'pearl_pouch',
    name: '珍珠礼袋',
    latin: 'PEARL POUCH',
    description: '手搓的黑糖珍珠，摇起来手感格外好。',
    effectLabel: '次日薄荷区 +18%',
    shortLabel: '薄荷区 +18%',
    cost: 30,
    color: '#d5ab84',
    icon: 'top-pearl',
    buff: { zone: 0.18 },
  },
  {
    id: 'sea_cream',
    name: '海盐奶油',
    latin: 'SEA CREAM',
    description: '一点点咸，把甜味托得更高，是面包房偷偷教的。',
    effectLabel: '次日每杯收入 +8%',
    shortLabel: '收入 +8%',
    cost: 45,
    color: '#ffe6bf',
    icon: 'top-cheese',
    buff: { price: 0.08 },
  },
];

export const SUPPLIES_MAP = Object.fromEntries(SUPPLIES.map((supply) => [supply.id, supply])) as Record<SupplyId, SupplyDef>;

export function supplyBuff(supplies: SupplyId[]): Required<SupplyBuff> {
  const buff = { tip: 0, patience: 0, zone: 0, price: 0 };
  for (const id of supplies) {
    const supply = SUPPLIES_MAP[id];
    if (!supply) continue;
    buff.tip += supply.buff.tip ?? 0;
    buff.patience += supply.buff.patience ?? 0;
    buff.zone += supply.buff.zone ?? 0;
    buff.price += supply.buff.price ?? 0;
  }
  return buff;
}

// ───────────────────────────────────────── city map

export interface CitySpotDef {
  id: CitySpotId;
  name: string;
  latin: string;
  tagline: string;
  icon: string;
  color: string;
}

export const CITY_SPOTS: CitySpotDef[] = [
  {
    id: 'market',
    name: '阿婆原料市场',
    latin: 'MORNING MARKET',
    tagline: '把明天的香气，一起带回去。',
    icon: 'cart',
    color: '#ffb0a2',
  },
  {
    id: 'bakery',
    name: '栗子面包房',
    latin: 'KURI BAKERY',
    tagline: '烤箱还热着，窗边总有故事。',
    icon: 'cake',
    color: '#ffd08b',
  },
  {
    id: 'flower',
    name: '蓝莓花店',
    latin: 'BERRY FLORIST',
    tagline: '花和茶，都是慢慢开的东西。',
    icon: 'leaf',
    color: '#a9dfc9',
  },
  {
    id: 'airclub',
    name: '航空俱乐部',
    latin: 'LITTLE AERO CLUB',
    tagline: '旧机库的钥匙，挂在门后。',
    icon: 'stars',
    color: '#aebbe8',
  },
  {
    id: 'home',
    name: '回家的路',
    latin: 'HOME',
    tagline: '路灯亮了，今晚就到这里吧。',
    icon: 'home',
    color: '#f3c4d2',
  },
  {
    id: 'shop',
    name: '桃桃茶屋',
    latin: 'PEACH & MINT',
    tagline: '门里还留着一盏小灯。',
    icon: 'peach',
    color: '#ff9fbe',
  },
];

export const CITY_SPOTS_MAP = Object.fromEntries(CITY_SPOTS.map((spot) => [spot.id, spot])) as Record<CitySpotId, CitySpotDef>;

// ───────────────────────────────────────── city stories

export interface CityReward {
  coins?: number;
  supply?: SupplyId;
  recipe?: string;
  rapport?: string;
  plane?: boolean;
}

export interface CityStoryChoice {
  label: string;
  reply: string;
  reward: CityReward;
}

export interface CityStoryDef {
  id: string;
  spot: CitySpotId;
  kicker: string;
  title: string;
  text: string;
  choices: CityStoryChoice[];
}

const KURI_PUDDING = 'caramel_pudding';
const OSMANTHUS_JELLY = 'osmanthus_jelly';
const OOLONG_SHAKE = 'oolong_shake';

export const CITY_STORIES: CityStoryDef[] = [
  {
    id: 'bakery-oven',
    spot: 'bakery',
    kicker: '面包房 · 傍晚六点',
    title: '烤箱边的空白配方',
    text: '栗子正对着烤盘发呆。她做了布丁，却怎么都觉得少了点什么。“店长，你觉得……把布丁放进奶茶里，会不会很奇怪？”',
    choices: [
      {
        label: '帮她把布丁切小块，试一杯。',
        reply: '布丁沉下去又浮起来，焦糖在杯壁拉出一条细细的金线。栗子在小本子上写下「焦糖布丁奶茶」，认真地画了三颗星。',
        reward: { coins: 12, recipe: KURI_PUDDING, rapport: 'kuri' },
      },
      {
        label: '先尝一口布丁，再慢慢想。',
        reply: '“好吃！”你还没说完，栗子已经笑弯了眼睛。她说配方可以慢慢试，先把此刻的甜记住。临走时塞给你一罐海盐奶油。',
        reward: { recipe: KURI_PUDDING, supply: 'sea_cream', rapport: 'kuri' },
      },
    ],
  },
  {
    id: 'bakery-window',
    spot: 'bakery',
    kicker: '面包房 · 打烊前',
    title: '留给晚归人的灯',
    text: '栗子正在把最后两个面包装进纸袋。“总有赶不上晚饭的人，我想给他们留一点热的。”她抬头问你，奶茶店是不是也一样。',
    choices: [
      {
        label: '“所以我们才开着门呀。”',
        reply: '栗子把纸袋递给你：“那这两个，算我请晚归的店长。”纸袋里除了面包，还有一小罐刚熬好的海盐奶油。',
        reward: { coins: 8, supply: 'sea_cream', rapport: 'kuri' },
      },
      {
        label: '帮她在窗边留一盏小灯。',
        reply: '橘色的小灯亮起来，街角忽然不那么冷了。栗子说，等你打烊路过，灯也会替她照着你。',
        reward: { coins: 16, rapport: 'kuri' },
      },
    ],
  },
  {
    id: 'flower-osmanthus',
    spot: 'flower',
    kicker: '花店 · 桂花落了一地',
    title: '一勺秋天的声音',
    text: '花店门口堆着新到的桂花。店长正踮脚够高处的玻璃罐，看到你便挥手：“来得正好！我熬了一锅桂花蜜，正愁没人帮我尝尝。”',
    choices: [
      {
        label: '把桂花蜜兑进冷泡茉莉。',
        reply: '花香浮在茶上，像一层薄薄的秋光。花店店长把配方抄在牛皮纸上：“拿去吧，白玉椰果会让它更好看。”',
        reward: { coins: 10, recipe: OSMANTHUS_JELLY, rapport: 'yuzu' },
      },
      {
        label: '先帮她把花搬进店里。',
        reply: '搬完最后一盆蓝绣球，店长把一小罐桂花蜜和一张配方塞给你。她说，愿意帮忙的人，值得多一勺甜。',
        reward: { recipe: OSMANTHUS_JELLY, supply: 'jasmine_tin', rapport: 'yuzu' },
      },
    ],
  },
  {
    id: 'flower-night',
    spot: 'flower',
    kicker: '花店 · 夜灯初上',
    title: '打烊后的花束',
    text: '店里还剩一小束卖不完的白桔梗。店长把它包好，想了想又放下。“送给谁好呢？丢掉太可惜了，可带回家又只有我一个人。”',
    choices: [
      {
        label: '“放在店里，明天会有客人喜欢。”',
        reply: '店长把花插进柜台的小玻璃瓶，笑说这是“给明天第一位客人的礼物”。她顺手给你包了一小罐茉莉茶。',
        reward: { coins: 6, supply: 'jasmine_tin' },
      },
      {
        label: '“那今天，就当送给自己的。”',
        reply: '她愣了愣，最后把花放在收银台边。回家的路上，花香一直跟着你。店长说明天会给你留最好的花。',
        reward: { coins: 18, rapport: 'tsukimi' },
      },
    ],
  },
  {
    id: 'airclub-key',
    spot: 'airclub',
    kicker: '航空俱乐部 · 旧机库',
    title: '门后的黄铜钥匙',
    text: '俱乐部管理员正在给一架奶油色小飞机掸灰。“它叫小桃号，飞得慢，但很稳。”她把一把黄铜钥匙放进你手心，“帮我收拾一下机库？这钥匙就送你了。”',
    choices: [
      {
        label: '卷起袖子，跟她一起搬旧木箱。',
        reply: '机库深处翻出一本旧配方，上面画着一杯炭焙乌龙奶昔。管理员说：“下次去远方，替我给山里人带杯奶茶。”',
        reward: { coins: 15, plane: true, recipe: OOLONG_SHAKE, rapport: 'alan' },
      },
      {
        label: '先帮她检查小桃号的螺旋桨。',
        reply: '螺旋桨转了一圈又一圈，像一颗慢慢醒来的风。管理员把钥匙和旧配方一起塞给你：“会检查飞机的人，也能照顾好一家店。”',
        reward: { plane: true, recipe: OOLONG_SHAKE, supply: 'pearl_pouch', rapport: 'alan' },
      },
    ],
  },
  {
    id: 'airclub-field',
    spot: 'airclub',
    kicker: '航空俱乐部 · 跑道边',
    title: '跑道尽头的小野花',
    text: '管理员坐在跑道边看日落。“飞得久了，最想念的还是一落地就能喝到的东西。”她问你，如果飞去很远的地方，会带什么回来。',
    choices: [
      {
        label: '“带一张明信片，和一杯新配方。”',
        reply: '她点点头：“那就别只带纪念品回来，要带点能让店里变好的东西。”她把小桃号的钥匙和旧配方一起放进你手心，又翻出一罐黑糖珍珠。',
        reward: { coins: 10, plane: true, recipe: OOLONG_SHAKE, supply: 'pearl_pouch', rapport: 'alan' },
      },
      {
        label: '“带一个想再去一次的理由。”',
        reply: '管理员笑了，说这句话比任何航线图都浪漫。她把钥匙交给你：“那就从下一次起飞开始。”临走还塞给你一点海盐奶油。',
        reward: { coins: 20, plane: true, recipe: OOLONG_SHAKE, supply: 'sea_cream', rapport: 'alan' },
      },
    ],
  },
];

export function storiesForSpot(spot: CitySpotId): CityStoryDef[] {
  return CITY_STORIES.filter((story) => story.spot === spot);
}

export function cityStoryById(id: string): CityStoryDef | undefined {
  return CITY_STORIES.find((story) => story.id === id);
}

// ───────────────────────────────────────── travel chapters

export type TravelMiniGame = 'timing' | 'quiz';

export interface TravelQuizOption {
  label: string;
  sub: string;
  correct: boolean;
}

export interface TravelQuizQuestion {
  prompt: string;
  hint: string;
  options: TravelQuizOption[];
}

export interface TravelTimingConfig {
  taps: number;
  speed: number;
  zone: number;
  drift: boolean;
  tapLabel: string;
  unit: string;
  hint: string;
  scale: [string, string, string];
  doneLine: string;
}

export interface TravelChoice {
  label: string;
  reply: string;
}

export interface TravelPostcard {
  title: string;
  caption: string;
  stamp: string;
  stampIcon: string;
}

export interface TravelChapterDef {
  id: string;
  index: number;
  name: string;
  latin: string;
  place: string;
  subtitle: string;
  scene: string[];
  choicePrompt: string;
  choices: [TravelChoice, TravelChoice];
  miniGame: TravelMiniGame;
  timing?: TravelTimingConfig;
  quiz?: TravelQuizQuestion[];
  recipeId: string;
  postcard: TravelPostcard;
  souvenir: string;
  souvenirIcon: string;
  rewardCoins: [number, number, number];
}

export const TRAVEL_CHAPTERS: TravelChapterDef[] = [
  {
    id: 'seaside',
    index: 1,
    name: '海风小镇',
    latin: 'SEASIDE TOWN',
    place: '潮汐汽水铺',
    subtitle: '一杯汽水，一次潮起',
    scene: [
      '小桃号落在海边的矮坡上。潮汐汽水铺的招牌被风吹得轻轻响，门里传来玻璃瓶碰撞的声音。',
      '看店的女孩正踮脚够高处的杯子：“店长！能帮我在浪花拍到台阶的时候，接住这三只汽水杯吗？它们要留给今天最后一批客人。”',
    ],
    choicePrompt: '先做点什么？',
    choices: [
      { label: '帮她扶着摇摇晃晃的梯子。', reply: '梯子稳住了，女孩笑着把第一只杯子递给你。海风从窗缝钻进来，带着橘子和盐的味道。' },
      { label: '把窗边被风吹乱的明信片收好。', reply: '明信片上全是从别的海边寄来的日落。女孩说，等这家店有了新配方，也要寄一张给你。' },
    ],
    miniGame: 'timing',
    timing: {
      taps: 3,
      speed: 0.92,
      zone: 0.115,
      drift: false,
      tapLabel: '接住！',
      unit: '杯',
      hint: '浪花推到台阶时按下，接住三只汽水杯。',
      scale: ['太早', '浪花正好', '太晚'],
      doneLine: '三只杯子稳稳当当，一滴都没洒。',
    },
    recipeId: 'sea_peach',
    postcard: {
      title: '潮汐汽水铺的黄昏',
      caption: '海风把杯壁的水珠吹成了小小的月亮。',
      stamp: 'SEA',
      stampIcon: 'bubble',
    },
    souvenir: '海盐糖罐',
    souvenirIcon: 'top-cheese',
    rewardCoins: [18, 30, 46],
  },
  {
    id: 'tea_mountain',
    index: 2,
    name: '雾山茶园',
    latin: 'MISTY TEA HILLS',
    place: '半山茶亭',
    subtitle: '一芽两叶，摘一段清晨',
    scene: [
      '晨雾还没散，茶山的绿色一层一层叠到云里。半山茶亭的老人把竹篮递给你：“今天只采一芽两叶，太早太晚都不算好。”',
      '露水从叶尖落下来，正好打湿了你的袖口。老人说，第一壶茶要等日头越过山脊才能煮，所以每一步都急不得。',
    ],
    choicePrompt: '采茶之前，先做哪件事？',
    choices: [
      { label: '坐下来，陪老人喝一碗粗茶。', reply: '粗茶有点苦，回甘却很长。老人说，先学会等，再去采。篮子里的叶子像被这句慢慢说醒了。' },
      { label: '帮他修好被雾打湿的竹篱。', reply: '竹篱修好时，第一缕阳光刚好落进茶园。老人笑着把最嫩的那一芽留给了你。' },
    ],
    miniGame: 'timing',
    timing: {
      taps: 3,
      speed: 1.22,
      zone: 0.095,
      drift: false,
      tapLabel: '采下！',
      unit: '芽',
      hint: '在一芽两叶最嫩的那一瞬按下，采满三篮。',
      scale: ['太嫩', '刚好的一芽两叶', '太老'],
      doneLine: '三篮新芽，带着露水和清晨的味道。',
    },
    recipeId: 'mist_matcha',
    postcard: {
      title: '雾山的清晨',
      caption: '茶叶上的露水，比星星还要安静。',
      stamp: 'MIST',
      stampIcon: 'leaf',
    },
    souvenir: '一罐明前茶',
    souvenirIcon: 'tea-matcha',
    rewardCoins: [20, 34, 50],
  },
  {
    id: 'snow_station',
    index: 3,
    name: '雪国车站',
    latin: 'SNOW STATION',
    place: '深夜热饮铺',
    subtitle: '雪落在灯上，热奶在手里',
    scene: [
      '小桃号停在雪国车站的月台边。最后一班车刚走，热饮铺的玻璃窗上蒙着一层白雾，里面只有一盏暖黄的灯。',
      '热饮机今天坏了一半，只能做热饮。看店的阿姨递来三张点单便签：“帮我对一对，别让等车的人再失望啦。”',
    ],
    choicePrompt: '月台风很大，先做什么？',
    choices: [
      { label: '把门帘放下来，挡住一阵风。', reply: '门帘落下，屋里的热气终于留住了。阿姨把一杯热牛奶放在你手边，说这是给帮忙的人留的。' },
      { label: '去月台请那位冻红鼻子的客人进来。', reply: '客人的睫毛上还挂着雪，进门后长长地呼出一口气。阿姨悄悄说，这杯要多加一点桂花。' },
    ],
    miniGame: 'quiz',
    quiz: [
      {
        prompt: '“想喝热的，不要太甜，要有桂花的香味。”',
        hint: '三人份的便签里，只有一杯同时满足三个条件。',
        options: [
          { label: '雪夜桂花热奶', sub: '热饮 · 半糖 · 桂花蜜', correct: true },
          { label: '海风蜜桃冰茶', sub: '正常冰 · 半糖 · 蜜桃', correct: false },
          { label: '云雾抹茶拿铁', sub: '少冰 · 半糖 · 抹茶', correct: false },
        ],
      },
      {
        prompt: '“热饮机只剩热的那一档，哪杯还能做？”',
        hint: '摸摸杯子，热的那个不会冒冷雾。',
        options: [
          { label: '星砂蜜桃奶昔', sub: '少冰 · 半糖 · 珍珠', correct: false },
          { label: '雪夜桂花热奶', sub: '热饮 · 半糖 · 鲜奶', correct: true },
          { label: '海风蜜桃冰茶', sub: '正常冰 · 半糖 · 乌龙', correct: false },
        ],
      },
    ],
    recipeId: 'snow_osmanthus',
    postcard: {
      title: '雪夜车站的灯',
      caption: '末班车开走了，灯还替谁亮着。',
      stamp: 'SNOW',
      stampIcon: 'star',
    },
    souvenir: '站台毛毯',
    souvenirIcon: 'ice-hot',
    rewardCoins: [18, 32, 48],
  },
  {
    id: 'star_island',
    index: 4,
    name: '星砂岛',
    latin: 'STAR SAND ISLAND',
    place: '流星夜市',
    subtitle: '接住一颗，刚好落下的星',
    scene: [
      '星砂岛的夜市挂在悬崖上，灯笼像一串不会落地的星星。卖星砂的老人说，今晚会有一场很小的流星雨，只留给愿意抬头的人。',
      '“帮我在星光落进灯罩的时候接住它们。”老人递来一只玻璃小瓶，“接满三颗，就够做一杯带星星的奶昔啦。”',
    ],
    choicePrompt: '流星来之前，先做什么？',
    choices: [
      { label: '帮老人把灯笼一盏盏点亮。', reply: '最后一盏灯笼亮起时，整条夜市像浮在夜空里。老人说，灯亮着，流星才找得到路。' },
      { label: '在小摊前给未来的自己写一张明信片。', reply: '你写下「下次也要好好开店」，老人看了一眼，笑着把瓶口擦得更亮了一点。' },
    ],
    miniGame: 'timing',
    timing: {
      taps: 3,
      speed: 1.4,
      zone: 0.105,
      drift: true,
      tapLabel: '接星！',
      unit: '颗',
      hint: '星光带着一点飘移，在落下时接住三颗。',
      scale: ['太早', '星光落下', '太晚'],
      doneLine: '瓶子里亮起三颗小星星，像三声轻轻的笑。',
    },
    recipeId: 'star_peach_shake',
    postcard: {
      title: '星砂岛的最后一颗流星',
      caption: '它没有许愿，只是安静地落进了杯子里。',
      stamp: 'STAR',
      stampIcon: 'stars',
    },
    souvenir: '星砂小瓶',
    souvenirIcon: 'sparkle',
    rewardCoins: [22, 38, 58],
  },
];

export const TRAVEL_CHAPTERS_MAP = Object.fromEntries(TRAVEL_CHAPTERS.map((chapter) => [chapter.id, chapter])) as Record<string, TravelChapterDef>;

export function travelChapter(id: string): TravelChapterDef | undefined {
  return TRAVEL_CHAPTERS_MAP[id];
}

export function chapterUnlocked(id: string, travel: TravelSave): boolean {
  const def = TRAVEL_CHAPTERS_MAP[id];
  if (!def) return false;
  if (def.index === 1) return true;
  const previous = TRAVEL_CHAPTERS.find((chapter) => chapter.index === def.index - 1);
  return previous ? !!travel.chapters[previous.id] : false;
}

export function travelSouvenirBonus(travel: TravelSave): number {
  return Object.keys(travel.chapters).length * 0.02;
}

export function completedChapterCount(travel: TravelSave): number {
  return Object.keys(travel.chapters).length;
}

export function chapterRecipe(chapterId: string): DrinkDef | undefined {
  const chapter = TRAVEL_CHAPTERS_MAP[chapterId];
  return chapter ? DRINKS_MAP[chapter.recipeId] : undefined;
}

export function travelRecipeIds(travel: TravelSave): string[] {
  return Object.keys(travel.chapters)
    .map((id) => TRAVEL_CHAPTERS_MAP[id]?.recipeId)
    .filter((id): id is string => typeof id === 'string');
}

export function cityRecipeIds(city: CitySave): string[] {
  return city.recipes.filter((id) => !!DRINKS_MAP[id]);
}

export function extraDrinkIds(city: CitySave, travel: TravelSave): string[] {
  return [...new Set([...cityRecipeIds(city), ...travelRecipeIds(travel)])].filter((id) => !!DRINKS_MAP[id]);
}

export function rewardLines(reward: CityReward): string[] {
  const lines: string[] = [];
  if (reward.plane) lines.push('小桃号钥匙');
  if (reward.recipe) {
    const drink = DRINKS_MAP[reward.recipe];
    if (drink) lines.push(`配方「${drink.name}」`);
  }
  if (reward.supply) {
    const supply = SUPPLIES_MAP[reward.supply];
    if (supply) lines.push(`补给「${supply.name}」`);
  }
  if (reward.rapport) lines.push('常客好感 +1');
  if (reward.coins) lines.push(`金币 +${reward.coins}`);
  return lines;
}
